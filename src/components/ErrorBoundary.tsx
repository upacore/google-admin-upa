import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'Ocorreu um erro inesperado na aplicação.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) {
        readable = `Operação protegida (${parsed.operationType || 'dados'}): ${parsed.error}`;
      }
    } catch {
      // plain string message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('UPA Portal ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E2E8F0] rounded-xl p-8">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#0A192F] mb-2">
              Erro de ligação ou permissão
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A192F] text-white text-sm font-medium rounded-lg hover:bg-[#112240] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
