use uuid::Uuid;

const UUID_NAMESPACE: &str = "1b671a64-40d5-491e-99b0-da01ff1f3341";

pub fn generate_uuid() -> String {
    let namespace = Uuid::parse_str(UUID_NAMESPACE).unwrap();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis()
        .to_string();
    let uuid = Uuid::new_v5(&namespace, now.as_bytes());
    format!("{}-{}", uuid, now)
}

pub fn get_local_ip() -> String {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string())
}
