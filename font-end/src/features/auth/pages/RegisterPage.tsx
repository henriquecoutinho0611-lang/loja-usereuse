import type { FormEvent } from "react";

interface RegisterPageProps {
  form: { name: string; email: string; phone: string; password: string };
  error: string;
  busy: boolean;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: "name" | "email" | "phone" | "password", value: string) => void;
}

export function RegisterPage({ form, error, busy, onBack, onSubmit, onChange }: RegisterPageProps) {
  return (
    <section className="form-page account-page">
      <button className="back-link" onClick={onBack}>← Voltar para entrar</button>
      <div className="account-card">
        <div className="eyebrow"><span className="eyebrow-line"></span>BEM-VINDA(O)</div>
        <h1>Crie sua conta</h1>
        <p className="form-intro">Acompanhe seus pedidos e use seus dados na próxima compra.</p>
        <form className="form-card" onSubmit={onSubmit}>
          <label>
            Nome completo
            <input value={form.name} onChange={(event) => onChange("name", event.currentTarget.value)} autoComplete="name" required maxLength={120} placeholder="Seu nome" />
          </label>
          <label>
            E-mail
            <input value={form.email} onChange={(event) => onChange("email", event.currentTarget.value)} type="email" autoComplete="email" required maxLength={180} placeholder="voce@email.com" />
          </label>
          <label>
            Telefone / WhatsApp
            <input value={form.phone} onChange={(event) => onChange("phone", event.currentTarget.value)} type="tel" autoComplete="tel" required minLength={10} maxLength={20} pattern="[0-9()+.\s-]{10,20}" placeholder="(11) 99999-9999" />
          </label>
          <label>
            Senha
            <input value={form.password} onChange={(event) => onChange("password", event.currentTarget.value)} type="password" autoComplete="new-password" minLength={8} maxLength={72} required placeholder="Mínimo de 8 caracteres" />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-dark form-submit" disabled={busy}>
            {busy ? "Criando conta..." : "Criar minha conta"} →
          </button>
        </form>
      </div>
    </section>
  );
}
