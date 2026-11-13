public class GenerateSecretHash {
    public static void main(String[] args) {
        String hash =
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12)
                        .encode("SECRET_CUA_BAN");

        System.out.println(hash);
    }
}