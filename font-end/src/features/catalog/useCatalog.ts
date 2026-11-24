import { useEffect, useRef, useState } from "react";
import type { Banner, Product, StoreSettings } from "../../app/models";
import { storeApi } from "../../services/api";
import { EMPTY_PRODUCT_FILTERS, matchesProductFilters, productMaterialOptions } from "./catalogService";
import type { ProductFilters } from "./catalogService";
import { matchesProductSearch } from "../../app/product-search";

export const PROMO_BANNERS: Banner[] = [
  {
    eyebrow: "FERRO, MADEIRA E PERSONALIDADE",
    title: "Móveis com\nforça e propósito.",
    text: "Design industrial para transformar seus espaços e durar por muitos anos.",
    cta: "Ver coleção industrial",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=90",
    tag: "ATÉ 30% OFF",
  },
  {
    eyebrow: "FEITO PARA FICAR",
    title: "Estrutura forte.\nEstilo de sobra.",
    text: "Peças que unem metal, madeira e funcionalidade para o dia a dia.",
    cta: "Conhecer os móveis",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=90",
    tag: "NOVA COLEÇÃO",
  },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsappNumber: "",
  saoPauloCityPrice: null,
  saoPauloStatePrice: null,
  deliveryOutsideStateMessage: "Para entregas fora do estado de São Paulo, entre em contato para combinar o frete e o prazo.",
  paymentMessage: "A loja combinará o pagamento após o envio do pedido.",
};

export function money(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

export function imageUrl(path: string | null | undefined): string {
  return storeApi.imageUrl(path);
}

interface UseCatalogProps {
  onCatalogSynced?: (products: Product[]) => void;
  isHomeScreen: boolean;
}

export function useCatalog({ onCatalogSynced, isHomeScreen }: UseCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>(PROMO_BANNERS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos os departamentos");
  const [search, setSearch] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeShowroomIndex, setActiveShowroomIndex] = useState(0);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("featured");
  const [productFilters, setProductFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);

  const showroomObserver = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const catalog = await storeApi.products();
        if (!active) return;
        setProducts(catalog);
        onCatalogSynced?.(catalog);
        setProductError("");
      } catch (error) {
        if (active) setProductError(storeApi.errorMessage(error, "Não foi possível carregar o catálogo do banco de dados."));
      } finally {
        if (active) setProductLoading(false);
      }

      try {
        const remoteBanners = await storeApi.banners();
        if (active && remoteBanners.length) setBanners(remoteBanners);
      } catch {
        // Keep the presentation banners while the API is offline.
      }

      try {
        const settings = await storeApi.storeSettings();
        if (active) setStoreSettings(settings);
      } catch {
        // Keep default settings
      }
    })();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBannerIndex((current) => (current + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!window.IntersectionObserver || !isHomeScreen) return;
    const timer = window.setTimeout(() => {
      const steps = document.querySelectorAll<HTMLElement>("[data-showroom-index]");
      if (!steps.length) return;
      const observer = new IntersectionObserver((entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active) setActiveShowroomIndex(Number((active.target as HTMLElement).dataset["showroomIndex"] || 0));
      }, { rootMargin: "-32% 0px -32% 0px", threshold: [0, 0.12, 0.24, 0.36, 0.48] });
      steps.forEach((step) => observer.observe(step));
      showroomObserver.current = observer;
    }, 60);

    return () => {
      window.clearTimeout(timer);
      showroomObserver.current?.disconnect();
    };
  }, [isHomeScreen, products]);

  function retryCatalog(): void {
    setProductLoading(true);
    setProductError("");
    void (async () => {
      try {
        const [catalog, settings] = await Promise.all([
          storeApi.products(),
          storeApi.storeSettings(),
        ]);
        setProducts(catalog);
        onCatalogSynced?.(catalog);
        setStoreSettings(settings);
      } catch (error) {
        setProductError(storeApi.errorMessage(error, "Não foi possível carregar o catálogo do banco de dados."));
      } finally {
        setProductLoading(false);
      }
    })();
  }

  function clearFilters(): void {
    setSearch("");
    setSelectedDepartment("Todos os departamentos");
    setProductFilters(EMPTY_PRODUCT_FILTERS);
    setFeaturedOnly(false);
    setSortOrder("featured");
  }

  const departments = ["Todos os departamentos", ...new Set(products.map((product) => product.department).filter(Boolean))];
  const materials = productMaterialOptions(products);

  const visibleProducts = products.filter((product) => {
    const inDepartment = selectedDepartment === "Todos os departamentos" || product.department === selectedDepartment;
    return inDepartment && matchesProductSearch(product, search) && matchesProductFilters(product, productFilters);
  });

  const departmentProducts = products
    .filter((product) => product.department === selectedDepartment
      && (!featuredOnly || product.featured)
      && matchesProductSearch(product, search)
      && matchesProductFilters(product, productFilters))
    .sort((a, b) => {
      if (sortOrder === "price-asc") return a.price - b.price;
      if (sortOrder === "price-desc") return b.price - a.price;
      if (sortOrder === "name") return a.title.localeCompare(b.title, "pt-BR");
      return Number(b.featured) - Number(a.featured);
    });

  const featuredProducts = products.filter((product) => product.featured);
  const showroomProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 5);
  const showroomProduct = showroomProducts.length ? showroomProducts[activeShowroomIndex % showroomProducts.length] : null;
  const highlightedProduct = departmentProducts.find((product) => product.featured) || departmentProducts[0] || null;

  const whatsappNumber = storeSettings.whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os produtos da loja.")}`
    : "";

  return {
    products,
    setProducts,
    banners,
    storeSettings,
    setStoreSettings,
    productLoading,
    productError,
    retryCatalog,
    selectedDepartment,
    setSelectedDepartment,
    search,
    setSearch,
    bannerIndex,
    setBannerIndex,
    activeShowroomIndex,
    setActiveShowroomIndex,
    featuredOnly,
    setFeaturedOnly,
    sortOrder,
    setSortOrder,
    productFilters,
    setProductFilters,
    clearFilters,
    departments,
    materials,
    visibleProducts,
    departmentProducts,
    featuredProducts,
    showroomProducts,
    showroomProduct,
    highlightedProduct,
    whatsappUrl,
  };
}
