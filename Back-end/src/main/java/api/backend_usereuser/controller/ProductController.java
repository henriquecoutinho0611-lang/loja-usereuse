package api.backend_usereuser.controller;

import api.backend_usereuser.dto.ProductRequest;
import api.backend_usereuser.dto.ProductResponse;
import api.backend_usereuser.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ProductController {
    private final ProductService products;
    public ProductController(ProductService products) { this.products = products; }

    @GetMapping("/products")
    public List<ProductResponse> publicProducts() {

        return products.listPublic(); }

    @GetMapping("/admin/products")
    public List<ProductResponse> merchantProducts() {

        return products.listForMerchant(); }

    @PostMapping("/admin/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {

        return products.create(request); }

    @PutMapping("/admin/products/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {

        return products.update(id, request); }

    @DeleteMapping("/admin/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {

        products.delete(id); }
}
