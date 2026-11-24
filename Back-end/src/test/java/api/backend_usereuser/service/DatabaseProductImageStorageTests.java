package api.backend_usereuser.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.sql.Connection;
import java.sql.PreparedStatement;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

class DatabaseProductImageStorageTests {
    @Test
    void storesImageBytesAndReturnsPublicImageUrl() throws Exception {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        DatabaseProductImageStorage storage = new DatabaseProductImageStorage(jdbc);
        byte[] imageBytes = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        MockMultipartFile image = new MockMultipartFile("file", "product.png", "image/png", imageBytes);

        String url = storage.store(image);

        ArgumentCaptor<PreparedStatementCreator> statementCreator = ArgumentCaptor.forClass(PreparedStatementCreator.class);
        verify(jdbc).update(statementCreator.capture());
        assertTrue(url.matches("/api/products/images/[0-9a-f-]{36}"));
        Connection connection = mock(Connection.class);
        PreparedStatement statement = mock(PreparedStatement.class);
        when(connection.prepareStatement(org.mockito.ArgumentMatchers.anyString())).thenReturn(statement);
        statementCreator.getValue().createPreparedStatement(connection);
        verify(statement).setBytes(3, imageBytes);
    }
}
