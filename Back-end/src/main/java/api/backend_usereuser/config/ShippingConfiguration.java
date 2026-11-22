package api.backend_usereuser.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.shipping")
public class ShippingConfiguration {
    private String saoPauloCapitalPrice;
    private String saoPauloStatePrice;

    public String getSaoPauloCapitalPrice() { return saoPauloCapitalPrice; }
    public void setSaoPauloCapitalPrice(String saoPauloCapitalPrice) { this.saoPauloCapitalPrice = saoPauloCapitalPrice; }
    public String getSaoPauloStatePrice() { return saoPauloStatePrice; }
    public void setSaoPauloStatePrice(String saoPauloStatePrice) { this.saoPauloStatePrice = saoPauloStatePrice; }
}
