package api.backend_usereuser.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor
public class StoreSettingsEntity {
    @Id
    private Integer id = 1;

    @Column(name = "whatsapp_number", nullable = false, length = 24)
    private String whatsappNumber = "";

    @Column(name = "sao_paulo_city_price", precision = 12, scale = 2)
    private BigDecimal saoPauloCityPrice;

    @Column(name = "sao_paulo_state_price", precision = 12, scale = 2)
    private BigDecimal saoPauloStatePrice;

    @Column(name = "delivery_outside_state_message", nullable = false, length = 500)
    private String deliveryOutsideStateMessage = "Para entregas fora do estado de São Paulo, entre em contato para combinar o frete e o prazo.";

    @Column(name = "payment_message", nullable = false, length = 500)
    private String paymentMessage = "A loja combinará o pagamento após o envio do pedido.";
}
