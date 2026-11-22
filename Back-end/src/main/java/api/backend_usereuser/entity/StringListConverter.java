package api.backend_usereuser.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {
    @Override
    public String convertToDatabaseColumn(List<String> value) {
        if (value == null || value.isEmpty()) return "";
        StringBuilder encoded = new StringBuilder();
        for (String item : value) encoded.append(item.length()).append(':').append(item);
        return encoded.toString();
    }

    @Override
    public List<String> convertToEntityAttribute(String value) {
        if (value == null || value.isBlank() || value.equals("[]")) return List.of();
        List<String> decoded = new ArrayList<>();
        int cursor = 0;
        while (cursor < value.length()) {
            int separator = value.indexOf(':', cursor);
            if (separator < 0) throw new IllegalArgumentException("As opções salvas do produto estão inválidas.");
            int itemLength;
            try {
                itemLength = Integer.parseInt(value.substring(cursor, separator));
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("As opções salvas do produto estão inválidas.", ex);
            }
            int itemStart = separator + 1;
            int itemEnd = itemStart + itemLength;
            if (itemLength < 0 || itemEnd > value.length()) {
                throw new IllegalArgumentException("As opções salvas do produto estão inválidas.");
            }
            decoded.add(value.substring(itemStart, itemEnd));
            cursor = itemEnd;
        }
        return List.copyOf(decoded);
    }
}
