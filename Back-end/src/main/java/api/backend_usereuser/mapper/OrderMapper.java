package api.backend_usereuser.mapper;

import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.dto.ProductSelection;
import api.backend_usereuser.entity.OrderEntity;
import api.backend_usereuser.entity.OrderItemEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    @Mapping(target = "orderNumber", expression = "java(\"PED-\" + order.getId().toString().substring(0, 8).toUpperCase())")
    OrderResponse toResponse(OrderEntity order);

    @Mapping(source = "productTitle", target = "title")
    @Mapping(target = "selection", expression = "java(new ProductSelection(item.getIronColor(), item.getWoodColor(), item.getWoodType(), item.getUpholsteryColor()))")
    OrderResponse.Item toResponse(OrderItemEntity item);
}
