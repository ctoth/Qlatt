//! Exercise all five crates in one native host, including independent states.
use chalker_radiation::*;
use differentiator::*;
use glottal_mod::*;
use impulse_train::*;
use noise_source::*;

#[test]
fn native_filters_and_sources() {
    unsafe {
        let diff = differentiator_new(10000.0, 1);
        assert_eq!(differentiator_sample(diff, 1.0, 0.0, 0.0, 0.0), 1.0);
        assert_eq!(differentiator_sample(diff, 0.0, 0.0, 0.0, 0.0), -1.0);
        assert_eq!(differentiator_sample(diff, 0.0, 0.0, 0.0, 0.0), 0.0);
        differentiator_free(diff);

        let rad = chalker_radiation_new(10000.0, 1);
        for (input, expected) in [
            (1.0, 23.0 / 24.0),
            (0.0, -22.0 / 24.0),
            (0.0, -1.0 / 24.0),
            (0.0, 0.0),
        ] {
            assert!((chalker_radiation_sample(rad, input, 0.0, 0.0, 0.0) - expected).abs() < 1e-14);
        }
        chalker_radiation_free(rad);

        let impulse = impulse_train_new(10000.0, 1);
        assert_eq!(impulse_train_sample(impulse, 0.0, 0.0, 1.0, 0.7), 0.0);
        assert_eq!(impulse_train_sample(impulse, 0.0, 100.0, 1.0, 0.7), 0.0);
        assert_eq!(impulse_train_sample(impulse, 0.0, 100.0, 1.0, 0.7), 1.0);
        impulse_train_free(impulse);

        let envelope = glottal_mod_new(10000.0, 1);
        for index in 0..100 {
            let value = glottal_mod_sample(envelope, 0.0, 100.0, 0.5, 0.0);
            assert!((0.5..=1.0).contains(&value));
            if index == 25 {
                assert_eq!(value, 1.0);
            }
            if index >= 50 {
                assert_eq!(value, 0.5);
            }
        }
        glottal_mod_free(envelope);
    }
}

#[test]
fn native_noise_seed_replays_and_states_are_independent() {
    unsafe {
        let a = noise_source_new(48000.0, 51);
        let b = noise_source_new(48000.0, 51);
        let other = noise_source_new(48000.0, 52);
        let mut different = false;
        for _ in 0..4096 {
            let x = noise_source_sample(a, 1.0, 1.0, 4000.0, 0.0);
            assert_eq!(x, noise_source_sample(b, 1.0, 1.0, 4000.0, 0.0));
            different |= x != noise_source_sample(other, 1.0, 1.0, 4000.0, 0.0);
        }
        assert!(different);
        noise_source_free(a);
        noise_source_free(b);
        noise_source_free(other);
        let zero = noise_source_new(48000.0, 0);
        let one = noise_source_new(48000.0, 1);
        assert_eq!(
            noise_source_sample(zero, 1.0, 1.0, 1000.0, 0.0),
            noise_source_sample(one, 1.0, 1.0, 1000.0, 0.0)
        );
        noise_source_free(zero);
        noise_source_free(one);
        assert!(noise_source_new(0.0, 1).is_null());
        noise_source_free(core::ptr::null_mut());
    }
}
