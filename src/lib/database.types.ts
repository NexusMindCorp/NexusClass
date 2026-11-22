/**
 * Tipagem estática do esquema Supabase (`public`) para o NexusClass.
 * Espelha exatamente `docker/constructionsSQL/01_esquema.sql` no formato
 * padrão do Supabase CLI (`supabase gen types typescript`).
 *
 * Para regenerar contra um projeto autenticado:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      alerta_calendario: {
        Row: {
          id_alerta: number;
          id_evento: number;
          lembrete_para: string;
          mensagem: string;
          minutos_antes: number;
        };
        Insert: {
          id_alerta?: number;
          id_evento: number;
          lembrete_para: string;
          mensagem: string;
          minutos_antes: number;
        };
        Update: {
          id_alerta?: number;
          id_evento?: number;
          lembrete_para?: string;
          mensagem?: string;
          minutos_antes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_alerta_evento";
            columns: ["id_evento"];
            isOneToOne: false;
            referencedRelation: "evento_calendario";
            referencedColumns: ["id_evento"];
          },
        ];
      };
      aluno_turma: {
        Row: {
          created_at: string;
          id_aluno: string;
          id_turma: number;
          situacao: string;
        };
        Insert: {
          created_at?: string;
          id_aluno: string;
          id_turma: number;
          situacao?: string;
        };
        Update: {
          created_at?: string;
          id_aluno?: string;
          id_turma?: number;
          situacao?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_aluno_turma_aluno";
            columns: ["id_aluno"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_aluno_turma_turma";
            columns: ["id_turma"];
            isOneToOne: false;
            referencedRelation: "turma";
            referencedColumns: ["id_turma"];
          },
        ];
      };
      atividade: {
        Row: {
          data_entrega: string;
          descricao: string;
          id_atividade: number;
          id_professor: string;
          id_turma: number;
          titulo: string;
        };
        Insert: {
          data_entrega: string;
          descricao: string;
          id_atividade?: number;
          id_professor: string;
          id_turma: number;
          titulo: string;
        };
        Update: {
          data_entrega?: string;
          descricao?: string;
          id_atividade?: number;
          id_professor?: string;
          id_turma?: number;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_atividade_professor";
            columns: ["id_professor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_atividade_turma";
            columns: ["id_turma"];
            isOneToOne: false;
            referencedRelation: "turma";
            referencedColumns: ["id_turma"];
          },
        ];
      };
      atividade_anexo: {
        Row: {
          id_anexo: number;
          id_atividade: number;
          id_objeto_storage: string;
        };
        Insert: {
          id_anexo?: number;
          id_atividade: number;
          id_objeto_storage: string;
        };
        Update: {
          id_anexo?: number;
          id_atividade?: number;
          id_objeto_storage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_ativ_anexo_atividade";
            columns: ["id_atividade"];
            isOneToOne: false;
            referencedRelation: "atividade";
            referencedColumns: ["id_atividade"];
          },
        ];
      };
      comentario_mural: {
        Row: {
          conteudo: string;
          created_at: string;
          id_autor: string;
          id_comentario: number;
          id_post: number;
        };
        Insert: {
          conteudo: string;
          created_at?: string;
          id_autor: string;
          id_comentario?: number;
          id_post: number;
        };
        Update: {
          conteudo?: string;
          created_at?: string;
          id_autor?: string;
          id_comentario?: number;
          id_post?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_comentario_autor";
            columns: ["id_autor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_comentario_post";
            columns: ["id_post"];
            isOneToOne: false;
            referencedRelation: "mural_post";
            referencedColumns: ["id_post"];
          },
        ];
      };
      denuncia: {
        Row: {
          created_at: string;
          descricao: string;
          id_autor: string;
          id_denuncia: number;
          id_denunciado: string;
          id_master: string | null;
          motivo: string;
          parecer_moderacao: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          descricao: string;
          id_autor: string;
          id_denuncia?: number;
          id_denunciado: string;
          id_master?: string | null;
          motivo: string;
          parecer_moderacao?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          descricao?: string;
          id_autor?: string;
          id_denuncia?: number;
          id_denunciado?: string;
          id_master?: string | null;
          motivo?: string;
          parecer_moderacao?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_denuncia_autor";
            columns: ["id_autor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_denuncia_denunciado";
            columns: ["id_denunciado"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_denuncia_master";
            columns: ["id_master"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
        ];
      };
      duvida: {
        Row: {
          assunto: string;
          created_at: string;
          descricao: string;
          id_aluno: string;
          id_duvida: number;
          id_professor: string | null;
          id_turma: number;
          resolveu: boolean;
          resposta: string | null;
        };
        Insert: {
          assunto: string;
          created_at?: string;
          descricao: string;
          id_aluno: string;
          id_duvida?: number;
          id_professor?: string | null;
          id_turma: number;
          resolveu?: boolean;
          resposta?: string | null;
        };
        Update: {
          assunto?: string;
          created_at?: string;
          descricao?: string;
          id_aluno?: string;
          id_duvida?: number;
          id_professor?: string | null;
          id_turma?: number;
          resolveu?: boolean;
          resposta?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_duvida_aluno";
            columns: ["id_aluno"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_duvida_professor";
            columns: ["id_professor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_duvida_turma";
            columns: ["id_turma"];
            isOneToOne: false;
            referencedRelation: "turma";
            referencedColumns: ["id_turma"];
          },
        ];
      };
      duvida_anexo: {
        Row: {
          id_anexo: number;
          id_duvida: number;
          id_objeto_storage: string;
        };
        Insert: {
          id_anexo?: number;
          id_duvida: number;
          id_objeto_storage: string;
        };
        Update: {
          id_anexo?: number;
          id_duvida?: number;
          id_objeto_storage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_duvida_anexo_duvida";
            columns: ["id_duvida"];
            isOneToOne: false;
            referencedRelation: "duvida";
            referencedColumns: ["id_duvida"];
          },
        ];
      };
      entrega_atividade: {
        Row: {
          atraso?: boolean | null;
          entregue_em: string;
          feedback: string | null;
          id_aluno: string;
          id_atividade: number;
          id_entrega: number;
          id_objeto_storage: string;
          nota: number | null;
        };
        Insert: {
          entregue_em?: string;
          feedback?: string | null;
          id_aluno: string;
          id_atividade: number;
          id_entrega?: number;
          id_objeto_storage: string;
          nota?: number | null;
        };
        Update: {
          entregue_em?: string;
          feedback?: string | null;
          id_aluno?: string;
          id_atividade?: number;
          id_entrega?: number;
          id_objeto_storage?: string;
          nota?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_entrega_aluno";
            columns: ["id_aluno"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_entrega_atividade";
            columns: ["id_atividade"];
            isOneToOne: false;
            referencedRelation: "atividade";
            referencedColumns: ["id_atividade"];
          },
        ];
      };
      escola: {
        Row: {
          ano_letivo: number;
          codigo_publico: string;
          created_at: string;
          id_escola: number;
          nome: string;
        };
        Insert: {
          ano_letivo: number;
          codigo_publico?: string;
          created_at?: string;
          id_escola?: number;
          nome: string;
        };
        Update: {
          ano_letivo?: number;
          codigo_publico?: string;
          created_at?: string;
          id_escola?: number;
          nome?: string;
        };
        Relationships: [];
      };
      evento_calendario: {
        Row: {
          data: string;
          descricao: string;
          horario: string;
          id_autor: string;
          id_evento: number;
          id_turma: number | null;
          tipo: string;
          titulo: string;
        };
        Insert: {
          data: string;
          descricao?: string;
          horario: string;
          id_autor: string;
          id_evento?: number;
          id_turma?: number | null;
          tipo?: string;
          titulo: string;
        };
        Update: {
          data?: string;
          descricao?: string;
          horario?: string;
          id_autor?: string;
          id_evento?: number;
          id_turma?: number | null;
          tipo?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_evento_autor";
            columns: ["id_autor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_evento_turma";
            columns: ["id_turma"];
            isOneToOne: false;
            referencedRelation: "turma";
            referencedColumns: ["id_turma"];
          },
        ];
      };
      mensagem: {
        Row: {
          conteudo: string;
          created_at: string;
          id_destinatario: string;
          id_mensagem: number;
          id_remetente: string;
          lida: boolean;
        };
        Insert: {
          conteudo: string;
          created_at?: string;
          id_destinatario: string;
          id_mensagem?: number;
          id_remetente: string;
          lida?: boolean;
        };
        Update: {
          conteudo?: string;
          created_at?: string;
          id_destinatario?: string;
          id_mensagem?: number;
          id_remetente?: string;
          lida?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "fk_mensagem_destinatario";
            columns: ["id_destinatario"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_mensagem_remetente";
            columns: ["id_remetente"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
        ];
      };
      mural_post: {
        Row: {
          conteudo: string;
          created_at: string;
          id_autor: string;
          id_post: number;
          id_turma: number;
        };
        Insert: {
          conteudo: string;
          created_at?: string;
          id_autor: string;
          id_post?: number;
          id_turma: number;
        };
        Update: {
          conteudo?: string;
          created_at?: string;
          id_autor?: string;
          id_post?: number;
          id_turma?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_mural_post_autor";
            columns: ["id_autor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_mural_post_turma";
            columns: ["id_turma"];
            isOneToOne: false;
            referencedRelation: "turma";
            referencedColumns: ["id_turma"];
          },
        ];
      };
      perfil: {
        Row: {
          bio: string | null;
          created_at: string;
          email: string;
          foto_url: string | null;
          id_escola: number | null;
          id_perfil: string;
          nome: string;
          role: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          email: string;
          foto_url?: string | null;
          id_escola?: number | null;
          id_perfil: string;
          nome: string;
          role?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          email?: string;
          foto_url?: string | null;
          id_escola?: number | null;
          id_perfil?: string;
          nome?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_perfil_escola";
            columns: ["id_escola"];
            isOneToOne: false;
            referencedRelation: "escola";
            referencedColumns: ["id_escola"];
          },
        ];
      };
      professor_turma: {
        Row: {
          created_at: string;
          id_professor: string;
          id_turma: number;
        };
        Insert: {
          created_at?: string;
          id_professor: string;
          id_turma: number;
        };
        Update: {
          created_at?: string;
          id_professor?: string;
          id_turma?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_prof_turma_professor";
            columns: ["id_professor"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_prof_turma_turma";
            columns: ["id_turma"];
            isOneToOne: false;
            referencedRelation: "turma";
            referencedColumns: ["id_turma"];
          },
        ];
      };
      ticket_suporte: {
        Row: {
          assunto: string;
          created_at: string;
          id_master: string | null;
          id_perfil: string;
          id_suporte: number;
          mensagem: string;
          resposta_suporte: string | null;
          status: string;
        };
        Insert: {
          assunto: string;
          created_at?: string;
          id_master?: string | null;
          id_perfil: string;
          id_suporte?: number;
          mensagem: string;
          resposta_suporte?: string | null;
          status?: string;
        };
        Update: {
          assunto?: string;
          created_at?: string;
          id_master?: string | null;
          id_perfil?: string;
          id_suporte?: number;
          mensagem?: string;
          resposta_suporte?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_ticket_master";
            columns: ["id_master"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
          {
            foreignKeyName: "fk_ticket_perfil";
            columns: ["id_perfil"];
            isOneToOne: false;
            referencedRelation: "perfil";
            referencedColumns: ["id_perfil"];
          },
        ];
      };
      ticket_suporte_anexo: {
        Row: {
          id_anexo: number;
          id_objeto_storage: string;
          id_suporte: number;
        };
        Insert: {
          id_anexo?: number;
          id_objeto_storage: string;
          id_suporte: number;
        };
        Update: {
          id_anexo?: number;
          id_objeto_storage?: string;
          id_suporte?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_ticket_anexo_suporte";
            columns: ["id_suporte"];
            isOneToOne: false;
            referencedRelation: "ticket_suporte";
            referencedColumns: ["id_suporte"];
          },
        ];
      };
      turma: {
        Row: {
          banner_url: string | null;
          codigo_acesso: string;
          id_escola: number;
          id_turma: number;
          materia: string;
          periodo_escolar: string;
          sala: string;
        };
        Insert: {
          banner_url?: string | null;
          codigo_acesso: string;
          id_escola: number;
          id_turma?: number;
          materia: string;
          periodo_escolar: string;
          sala: string;
        };
        Update: {
          banner_url?: string | null;
          codigo_acesso?: string;
          id_escola?: number;
          id_turma?: number;
          materia?: string;
          periodo_escolar?: string;
          sala?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_turma_escola";
            columns: ["id_escola"];
            isOneToOne: false;
            referencedRelation: "escola";
            referencedColumns: ["id_escola"];
          },
        ];
      };
    };
    Views: {
      v_storage_objetos: {
        Row: {
          bucket_id: string | null;
          id: string | null;
          name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      obter_codigo_publico_minha_escola: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type NomeTabelaPublica = keyof Database["public"]["Tables"];
export type TabelaRow<T extends NomeTabelaPublica> = Database["public"]["Tables"][T]["Row"];
export type TabelaInsert<T extends NomeTabelaPublica> = Database["public"]["Tables"][T]["Insert"];
export type TabelaUpdate<T extends NomeTabelaPublica> = Database["public"]["Tables"][T]["Update"];
