//! Shared WASM memory allocation helpers for Klatt primitive crates.
//!
//! These functions are required for the AudioWorklet WASM pattern where
//! JavaScript needs to allocate/deallocate f32 buffers in WASM linear memory.

/// Match JavaScript's `sample || 0` numeric normalization without a data-dependent
/// branch: NaNs and signed zero become positive zero; finite nonzero values and
/// infinities retain their exact bits.
///
/// The masks follow the IEEE 754-2019 binary32 interchange format.
#[inline]
pub fn normalize_worklet_sample(sample: f32) -> f32 {
    const MAGNITUDE_MASK: u32 = 0x7fff_ffff;
    const EXPONENT_MASK: u32 = 0x7f80_0000;
    const SIGNIFICAND_MASK: u32 = 0x007f_ffff;

    let bits = sample.to_bits();
    let is_zero = ((bits & MAGNITUDE_MASK) == 0) as u32;
    let exponent_is_all_ones = (bits & EXPONENT_MASK) == EXPONENT_MASK;
    let significand_is_nonzero = (bits & SIGNIFICAND_MASK) != 0;
    let is_nan = (exponent_is_all_ones & significand_is_nonzero) as u32;
    let keep = ((is_zero | is_nan) == 0) as u32;
    f32::from_bits(bits & 0_u32.wrapping_sub(keep))
}

/// Allocate a zeroed f32 buffer in WASM linear memory.
///
/// # Arguments
/// * `len` - Number of f32 elements to allocate
///
/// # Returns
/// Pointer to the allocated buffer. Caller is responsible for calling
/// `dealloc_f32` with the same length when done.
///
/// # Safety
/// The returned pointer must be passed to `dealloc_f32` with the exact
/// same `len` value to avoid memory leaks or undefined behavior.
#[inline]
pub fn alloc_f32(len: usize) -> *mut f32 {
    if len == 0 {
        return core::ptr::null_mut();
    }
    let mut buf = vec![0.0f32; len];
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf);
    ptr
}

/// Deallocate an f32 buffer previously allocated with `alloc_f32`.
///
/// # Arguments
/// * `ptr` - Pointer returned by `alloc_f32`
/// * `len` - Same length passed to `alloc_f32`
///
/// # Safety
/// - `ptr` must have been returned by `alloc_f32`
/// - `len` must match the original allocation length
/// - Must not be called twice on the same pointer
pub unsafe fn dealloc_f32(ptr: *mut f32, len: usize) {
    if ptr.is_null() {
        return;
    }
    let _ = Vec::from_raw_parts(ptr, 0, len);
}

/// Macro to re-export the alloc functions with #[no_mangle].
/// Use this in each primitive crate's lib.rs.
///
/// # Example
/// ```ignore
/// klatt_wasm_common::export_alloc_fns!();
/// ```
#[macro_export]
macro_rules! export_alloc_fns {
    () => {
        #[no_mangle]
        pub extern "C" fn alloc_f32(len: usize) -> *mut f32 {
            $crate::alloc_f32(len)
        }

        #[no_mangle]
        pub unsafe extern "C" fn dealloc_f32(ptr: *mut f32, len: usize) {
            $crate::dealloc_f32(ptr, len)
        }
    };
}

#[cfg(test)]
mod tests {
    use super::normalize_worklet_sample;

    #[test]
    fn worklet_sample_normalization_matches_javascript_or_zero() {
        for input in [1.25_f32, -7.0, f32::INFINITY, f32::NEG_INFINITY] {
            assert_eq!(normalize_worklet_sample(input).to_bits(), input.to_bits());
        }
        for input in [0.0_f32, -0.0, f32::NAN, f32::from_bits(0xffc0_1234)] {
            assert_eq!(normalize_worklet_sample(input).to_bits(), 0.0_f32.to_bits());
        }
    }
}
