package api.backend_usereuser.mapper;

import api.backend_usereuser.dto.UserSummary;
import api.backend_usereuser.entity.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "role", expression = "java(user.getRole().name())")
    UserSummary toSummary(UserEntity user);
}
