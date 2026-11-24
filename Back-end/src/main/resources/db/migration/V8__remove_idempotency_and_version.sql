-- Migration V8: Remove idempotency table and payment-related columns
-- A lógica de idempotência foi movida integralmente para o front-end (orderAttempt.ts).
-- A tabela idempotency_records não agrega valor para uma loja de pequeno porte
-- onde o cliente front-end já garante unicidade via sessionStorage + UUID.
DROP TABLE IF EXISTS idempotency_records;

-- Remove a coluna version de locking otimista em orders.
-- Não há concorrência real de escrita simultânea nesta loja; o locking
-- gerava exceções desnecessárias sem benefício observável.
ALTER TABLE orders DROP COLUMN IF EXISTS version;
