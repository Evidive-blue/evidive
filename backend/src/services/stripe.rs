use stripe::Client;

use crate::config::Config;

/// Build a Stripe API client from the app config.
pub fn build_stripe_client(config: &Config) -> Client {
    Client::new(&config.stripe_secret_key)
}
