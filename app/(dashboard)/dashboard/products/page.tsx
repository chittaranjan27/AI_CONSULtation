"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Plus, Edit2, Trash2, Loader2, Sparkles, Check, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  checkoutUrl: string | null;
  isActive: boolean;
  chatbotId: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [chatbots, setChatbots] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "hair_care",
    checkoutUrl: "",
    isActive: true,
    chatbotId: "",
  });

  const categories = [
    { value: "hair_care", label: "Hair Care" },
    { value: "skin_care", label: "Skin Care" },
    { value: "wellness", label: "General Wellness" },
    { value: "intimate_care", label: "Intimate Care" },
  ];

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chatbots
  const fetchChatbots = async () => {
    try {
      const res = await fetch("/api/chatbots");
      if (res.ok) {
        const data = await res.json();
        setChatbots(data);
      }
    } catch (err) {
      console.error("Failed to fetch chatbots", err);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          window.location.href = "/login";
          return;
        }
        const user = await authRes.json();
        if (user.role !== "SUPER_ADMIN" && user.role !== "TENANT_OWNER" && user.role !== "MANAGER") {
          window.location.href = "/dashboard";
          return;
        }
        await fetchProducts();
        await fetchChatbots();
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuthAndLoad();
  }, []);

  // Open modal for creating new product
  const handleCreateOpen = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "hair_care",
      checkoutUrl: "",
      isActive: true,
      chatbotId: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing product
  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      category: product.category || "hair_care",
      checkoutUrl: product.checkoutUrl || "",
      isActive: product.isActive,
      chatbotId: product.chatbotId || "",
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    setIsSubmitLoading(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save product");
      
      await fetchProducts();
      setIsModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products Catalog</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage the products recommended to users by your AI consultation flow
          </p>
        </div>
        <button onClick={handleCreateOpen} className="btn-primary text-sm py-2.5 px-5 cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-purple)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center space-y-4 hover:transform-none">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-glass)] flex items-center justify-center border border-[var(--border-primary)]">
            <ShoppingBag className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">No products yet</h3>
            <p className="text-xs text-[var(--text-tertiary)] max-w-sm">
              Add products with descriptions, images, and checkout links. The AI will recommend them during consultation steps.
            </p>
          </div>
          <button onClick={handleCreateOpen} className="btn-primary text-xs py-2 px-4 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <div key={product.id} className="glass-card flex flex-col overflow-hidden group hover:transform-none relative">
              {/* Product Image */}
              <div className="h-40 bg-[var(--bg-tertiary)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-primary)]">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-[var(--text-muted)]" />
                )}
                {/* Active Badge */}
                <span
                  className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    product.isActive ? "badge-emerald" : "badge-red bg-red-500/10 text-red-400 border border-red-500/25"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-purple)] shrink-0">
                      {product.category?.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">•</span>
                    {product.chatbotId ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium truncate max-w-[120px]" title={chatbots.find(b => b.id === product.chatbotId)?.name || "Chatbot Assigned"}>
                        🤖 {chatbots.find(b => b.id === product.chatbotId)?.name || "Bot"}
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-glass)] border border-[var(--border-primary)] text-[var(--text-tertiary)] font-medium shrink-0">
                        Global
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{product.name}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                    {product.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-primary)]">
                  <span className="text-base font-extrabold text-[var(--text-primary)]">
                    د.إ {product.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditOpen(product)}
                      className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer text-[var(--text-secondary)]"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--brand-purple)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Organic Hair Serum"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Price (د.إ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 29.99"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe the product benefits..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all resize-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/product.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Checkout URL
                    </label>
                    <input
                      type="url"
                      placeholder="Stripe, PayPal link, or any custom checkout page"
                      value={formData.checkoutUrl}
                      onChange={(e) => setFormData({ ...formData, checkoutUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold mb-1 block text-[var(--text-secondary)]">
                      Assign to Chatbot
                    </label>
                    <select
                      value={formData.chatbotId}
                      onChange={(e) => setFormData({ ...formData, chatbotId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    >
                      <option value="">All Chatbots (Global)</option>
                      {chatbots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-[var(--brand-purple)] focus:ring-[var(--brand-purple)]"
                    />
                    <label htmlFor="isActive" className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                      Active (AI can recommend this product)
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border-primary)] bg-[var(--bg-elevated)] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] text-sm font-semibold transition-colors cursor-pointer text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="btn-primary text-sm py-2 px-5 cursor-pointer"
                >
                  {isSubmitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingProduct ? "Save Changes" : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
