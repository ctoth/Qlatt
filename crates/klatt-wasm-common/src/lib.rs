//! Shared WASM memory allocation helpers for Klatt primitive crates.
//!
//! These functions are required for the AudioWorklet WASM pattern where
//! JavaScript needs to allocate/deallocate f32 buffers in WASM linear memory.

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
pub fn dealloc_f32(ptr: *mut f32, len: usize) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, len);
    }
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
        pub extern "C" fn dealloc_f32(ptr: *mut f32, len: usize) {
            $crate::dealloc_f32(ptr, len)
        }
    };
}
