import type { FormEvent } from "react";

interface MerchantLoginPageProps {
  form: { email: string; password: string; cpf: string };
  error: string;
  busy: boolean;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: "email" | "password" | "cpf", value: string) => void;
}

export function MerchantLoginPage({ form, error, busy, onBack, onSubmit, onChange }: MerchantLoginPageProps) {
  return (
    <section className="form-page admin-page">
      <button className="back-link" onClick={onBack}>← Voltar para a loja</button>
      <div className="account-card">
        <div className="admin-icon">LOJA</div>
        <div className="eyebrow"><span className="eyebrow-line"></span>ÁREA RESTRITA</div>
        <h1>Entrada do lojista</h1>
        <p className="form-intro">Use os dados de acesso da loja.</p>
        <form className="form-card" onSubmit={onSubmit}>
          <label>
            E-mail
            <input value={form.email} onChange={(event) => onChange("email", event.currentTarget.value)} type="email" autoComplete="username" required maxLength={180} placeholder="seu@email.com" />
          </label>
          <label>
            Senha
            <input value={form.password} onChange={(event) => onChange("password", event.currentTarget.value)} type="password" autoComplete="current-password" required maxLength={72} placeholder="Sua senha" />
          </label>
          <label>
            CPF cadastrado
            <input value={form.cpf} onChange={(event) => onChange("cpf", event.currentTarget.value)} inputMode="numeric" maxLength={14} pattern="(?:[0-9./]|-){11,14}" required placeholder="Somente números ou com pontuação" />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-dark form-submit" disabled={busy}>{busy ? "Validando..." : "Entrar no painel"} →</button>
        </form>
        <p className="backend-note">O acesso é administrado pelo responsável da loja.</p>
      </div>
    </section>
  );
}
