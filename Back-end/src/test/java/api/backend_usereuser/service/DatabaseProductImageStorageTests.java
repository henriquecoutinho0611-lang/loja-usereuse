package api.backend_usereuser.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.mock.web.MockMultipartFile;

import java.sql.Connection;
import java.sql.PreparedStatement;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DatabaseProductImageStorageTests {
    @Test
    void storesValidJpegImageAndReturnsUrl() throws Exception {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        Connection connection = mock(Connection.class);
        PreparedStatement statement = mock(PreparedStatement.class);
        when(connection.prepareStatement(any(String.class))).thenReturn(statement);
        when(jdbc.update(any(PreparedStatementCreator.class))).thenAnswer(invocation -> {
            PreparedStatementCreator psc = invocation.getArgument(0);
            psc.createPreparedStatement(connection);
            return 1;
        });

        ProductImageStorage storage = new ProductImageStorage(jdbc);
        MockMultipartFile file = new MockMultipartFile("file", "image.jpg", "image/jpeg",
                new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x00});

        String url = storage.store(file);

        assertNotNull(url);
        verify(connection).prepareStatement(any(String.class));
    }
}
