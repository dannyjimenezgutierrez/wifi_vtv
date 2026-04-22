from cryptography.fernet import Fernet

# Clave maestra para cifrado reversible (Simétrico)
# IMPORTANTE: No cambiar esta clave una vez que haya datos cifrados en la BD.
ENCRYPTION_KEY = b'K0dWTYfDyGHiLQrP1_JVdjPzq6GmBE9uz83ngciLdKE='
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_password(password: str) -> str:
    """Cifra una contraseña de texto plano a Base64."""
    if not password:
        return ""
    try:
        encoded_text = password.encode('utf-8')
        encrypted_text = cipher_suite.encrypt(encoded_text)
        return encrypted_text.decode('utf-8')
    except Exception as e:
        print(f"[SECURITY] Error al cifrar: {e}")
        return password

def decrypt_password(encrypted_password: str) -> str:
    """Descifra una contraseña de Base64 a texto plano."""
    if not encrypted_password:
        return ""
    try:
        decoded_encrypted_text = encrypted_password.encode('utf-8')
        decrypted_text = cipher_suite.decrypt(decoded_encrypted_text)
        return decrypted_text.decode('utf-8')
    except Exception as e:
        # Si falla el descifrado (probablemente texto plano), devolver original
        # print(f"[SECURITY] Error al descifrar o ya es texto plano: {e}")
        return encrypted_password
