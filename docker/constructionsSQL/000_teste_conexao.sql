SELECT
  'Conexão ativa com sucesso!' AS status,
  current_database()           AS banco_atual,
  current_user                 AS usuario_conectado,
  inet_server_port()           AS porta_container,
  current_setting('TIMEZONE')  AS fuso_horario,
  now()                        AS data_hora_servidor,
  version()                    AS versao_postgres;
