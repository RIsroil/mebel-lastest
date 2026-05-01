package project.mebel.user.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import project.mebel.user.UserEntity;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${secret-key}")
    private String secret;

    @Value("${access-token-exp}")
    private long accessTokenExpiration;

    @Value("${refresh-token-exp}")
    private long refreshTokenExpiration;

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateAccessToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        claims.put("phone", user.getPhone());

        Date expirationDate = new Date(System.currentTimeMillis() + accessTokenExpiration);
        claims.put("accessTokenExpiresAt", expirationDate.getTime()); // Add custom expiration timestamp

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getPhone())
                .setIssuedAt(new Date())
                .setExpiration(expirationDate)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(UserEntity user) {
        Date refreshExpirationDate = new Date(System.currentTimeMillis() + refreshTokenExpiration);

        return Jwts.builder()
                .setSubject(user.getPhone())
                .claim("refreshTokenExpiresAt", refreshExpirationDate.getTime()) // Custom claim
                .setIssuedAt(new Date())
                .setExpiration(refreshExpirationDate) // Standard `exp` field
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractPhone(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserEntity user) {
        final String phone = extractPhone(token);
        return (phone.equals(user.getPhone())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
