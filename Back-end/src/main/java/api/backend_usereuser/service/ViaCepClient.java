package api.backend_usereuser.service;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class ViaCepClient {
    private static final int CACHE_CAPACITY = 1000;
    private static final Duration CACHE_TTL = Duration.ofHours(24);
    private final RestClient client;
    private final Map<String, CachedAddress> cache = new LinkedHashMap<>(CACHE_CAPACITY, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, CachedAddress> eldest) {
            return size() > CACHE_CAPACITY;
        }
    };

    public ViaCepClient() {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        client = RestClient.builder()
                .baseUrl("https://viacep.com.br")
                .requestFactory(requestFactory)
                .build();
    }

    public Address lookup(String zipCode) {
        synchronized (cache) {
            CachedAddress cached = cache.get(zipCode);
            if (cached != null) {
                if (cached.expiresAt().isAfter(Instant.now())) return cached.address();
                cache.remove(zipCode);
            }
        }
        try {
            ViaCepResponse response = client.get()
                    .uri("/ws/{zipCode}/json/", zipCode)
                    .retrieve()
                    .body(ViaCepResponse.class);
            if (response == null || response.erro() || response.localidade() == null || response.uf() == null) {
                throw new ZipCodeNotFoundException();
            }
            Address address = new Address(response.localidade(), response.uf());
            synchronized (cache) {
                cache.put(zipCode, new CachedAddress(address, Instant.now().plus(CACHE_TTL)));
            }
            return address;
        } catch (ZipCodeNotFoundException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new ZipCodeLookupException(ex);
        }
    }

    public record Address(String city, String state) {}

    private record CachedAddress(Address address, Instant expiresAt) {}

    private record ViaCepResponse(String localidade, String uf, boolean erro) {}

    public static final class ZipCodeNotFoundException extends RuntimeException {}

    public static final class ZipCodeLookupException extends RuntimeException {
        public ZipCodeLookupException(Throwable cause) { super(cause); }
    }
}
