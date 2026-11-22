package api.backend_usereuser.entity;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StringListConverterTests {
    private final StringListConverter converter = new StringListConverter();

    @Test
    void roundTripsOptionsContainingSeparatorsAndUnicode() {
        List<String> options = List.of("Madeira: clara", "Ferro | preto", "Carvalho");

        assertEquals(options, converter.convertToEntityAttribute(converter.convertToDatabaseColumn(options)));
    }

    @Test
    void readsEmptyListsFromNewAndMigratedRows() {
        assertEquals(List.of(), converter.convertToEntityAttribute(""));
        assertEquals(List.of(), converter.convertToEntityAttribute("[]"));
    }
}
