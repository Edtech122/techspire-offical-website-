import java.sql.*;
import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;
import org.mindrot.jbcrypt.BCrypt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Claims;
import java.util.Date;

public class TechspireBackend {
    // Database Configuration (Replace with your MySQL details)
    private static final String DB_URL = "jdbc:mysql://localhost:3306/techspire_db?createDatabaseIfNotExist=true";
    private static final String DB_USER = "your_db_username";  // e.g., "root"
    private static final String DB_PASS = "your_db_password";  // e.g., "password"
    private static final String JWT_SECRET = "mySecretKey12345678901234567890";  // Use env var in production
    private static final long JWT_EXPIRATION = 86400000;  // 24 hours

    // Enum for Roles
    enum Role { STUDENT, FACULTY, ADMIN }

    // Database Connection Method
    private static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }

    // Initialize Database (Create tables if not exist)
    private static void initializeDatabase() {
        String createTableSQL = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('STUDENT', 'FACULTY', 'ADMIN') NOT NULL,
                full_name VARCHAR(255) NOT NULL
            );
            """;
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute(createTableSQL);
            System.out.println("Database initialized.");
        } catch (SQLException e) {
            System.err.println("Database initialization failed: " + e.getMessage());
        }
    }

    // User Registration
    private static boolean registerUser(String email, String password, Role role, String fullName) {
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());
        String insertSQL = "INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(insertSQL)) {
            pstmt.setString(1, email);
            pstmt.setString(2, hashedPassword);
            pstmt.setString(3, role.name());
            pstmt.setString(4, fullName);
            pstmt.executeUpdate();
            System.out.println("User registered successfully.");
            return true;
        } catch (SQLException e) {
            System.err.println("Registration failed: " + e.getMessage());
            return false;
        }
    }

    // User Login (Returns JWT token if successful)
    private static String loginUser(String email, String password) {
        String selectSQL = "SELECT password, role, full_name FROM users WHERE email = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(selectSQL)) {
            pstmt.setString(1, email);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                String hashedPassword = rs.getString("password");
                if (BCrypt.checkpw(password, hashedPassword)) {
                    String role = rs.getString("role");
                    String fullName = rs.getString("full_name");
                    // Generate JWT
                    String token = Jwts.builder()
                        .setSubject(email)
                        .claim("role", role)
                        .claim("fullName", fullName)
                        .setIssuedAt(new Date())
                        .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION))
                        .signWith(SignatureAlgorithm.HS512, JWT_SECRET)
                        .compact();
                    System.out.println("Login successful. Token: " + token);
                    return token;
                }
            }
            System.out.println("Invalid credentials.");
            return null;
        } catch (SQLException e) {
            System.err.println("Login failed: " + e.getMessage());
            return null;
        }
    }

    // Validate JWT Token (Returns user details if valid)
    private static Map<String, String> validateToken(String token) {
        try {
            Claims claims = Jwts.parser().setSigningKey(JWT_SECRET).parseClaimsJws(token).getBody();
            Map<String, String> userDetails = new HashMap<>();
            userDetails.put("email", claims.getSubject());
            userDetails.put("role", claims.get("role", String.class));
            userDetails.put("fullName", claims.get("fullName", String.class));
            return userDetails;
        } catch (Exception e) {
            System.err.println("Invalid token: " + e.getMessage());
            return null;
        }
    }

    // Protected Endpoint: Access LMS (Simulates role-based access)
    private static void accessLMS(String token) {
        Map<String, String> userDetails = validateToken(token);
        if (userDetails != null) {
            String role = userDetails.get("role");
            if ("STUDENT".equals(role) || "FACULTY".equals(role) || "ADMIN".equals(role)) {
                System.out.println("Welcome to LMS, " + userDetails.get("fullName") + " (" + role + ")!");
                // Simulate LMS data (e.g., courses, progress)
                System.out.println("Your courses: AI & ML (75% complete), Data Science (60% complete).");
            } else {
                System.out.println("Access denied: Insufficient role.");
            }
        } else {
            System.out.println("Access denied: Invalid token.");
        }
    }

    // Main Method (CLI for Testing)
    public static void main(String[] args) {
        initializeDatabase();
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\nTechSpire Backend Menu:");
            System.out.println("1. Register User");
            System.out.println("2. Login");
            System.out.println("3. Access LMS (Protected)");
            System.out.println("4. Exit");
            System.out.print("Choose an option: ");
            int choice = scanner.nextInt();
            scanner.nextLine();  // Consume newline

            switch (choice) {
                case 1:
                    System.out.print("Email: ");
                    String email = scanner.nextLine();
                    System.out.print("Password: ");
                    String password = scanner.nextLine();
                    System.out.print("Role (STUDENT/FACULTY/ADMIN): ");
                    Role role = Role.valueOf(scanner.nextLine().toUpperCase());
                    System.out.print("Full Name: ");
                    String fullName = scanner.nextLine();
                    registerUser(email, password, role, fullName);
                    break;
                case 2:
                    System.out.print("Email: ");
                    String loginEmail = scanner.nextLine();
                    System.out.print("Password: ");
                    String loginPassword = scanner.nextLine();
                    String token = loginUser(loginEmail, loginPassword);
                    if (token != null) {
                        System.out.println("Use this token for protected actions: " + token);
                    }
                    break;
                case 3:
                    System.out.print("Enter JWT Token: ");
                    String inputToken = scanner.nextLine();
                    accessLMS(inputToken);
                    break;
                case 4:
                    System.out.println("Exiting...");
                    scanner.close();
                    return;
                default:
                    System.out.println("Invalid option.");
            }
        }
    }
}
