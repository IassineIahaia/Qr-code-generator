-- =============================================================
-- QR Generator Pro — dados de exemplo para desenvolvimento
--
-- Antes de rodar: crie um usuário pelo app (ou em Authentication > Users),
-- copie o UUID dele e cole abaixo.
-- =============================================================

do $$
declare
  v_user   uuid := '00000000-0000-0000-0000-000000000000';  -- <<< troque pelo seu UUID
  v_pasta  uuid;
  v_qr     uuid;
  i        integer;
begin
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'Usuário % não encontrado. Cadastre-se no app e use o UUID real.', v_user;
  end if;

  insert into public.folders (user_id, name, color)
  values (v_user, 'Restaurante', '#FF4D00')
  returning id into v_pasta;

  -- QR ativo, com leituras
  insert into public.qr_codes (user_id, folder_id, name, slug, type, content, destination, tags)
  values (
    v_user, v_pasta, 'Cardápio Verão 2026', public.generate_qr_slug(),
    'url', '{"url": "https://exemplo.com.br/cardapio"}'::jsonb,
    'https://exemplo.com.br/cardapio', array['cardapio', 'mesa']
  )
  returning id into v_qr;

  for i in 1..240 loop
    insert into public.scans (qr_id, created_at, is_unique, device_type, os, browser, country, city)
    values (
      v_qr,
      now() - (random() * interval '30 days'),
      random() < 0.68,
      (array['mobile', 'mobile', 'mobile', 'desktop', 'tablet'])[1 + floor(random() * 5)::int],
      (array['Android', 'iOS', 'iOS', 'Windows'])[1 + floor(random() * 4)::int],
      (array['Chrome', 'Safari', 'Samsung Internet'])[1 + floor(random() * 3)::int],
      'BR',
      (array['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Maputo'])[1 + floor(random() * 4)::int]
    );
  end loop;

  -- QR pausado
  insert into public.qr_codes (user_id, name, slug, type, content, destination, status)
  values (
    v_user, 'Promoção Dia das Mães', public.generate_qr_slug(),
    'url', '{"url": "https://exemplo.com.br/promo"}'::jsonb,
    'https://exemplo.com.br/promo', 'paused'
  );

  -- QR expirado
  insert into public.qr_codes (user_id, name, slug, type, content, destination, expires_at)
  values (
    v_user, 'Evento Setembro', public.generate_qr_slug(),
    'url', '{"url": "https://exemplo.com.br/evento"}'::jsonb,
    'https://exemplo.com.br/evento', now() - interval '2 days'
  );

  -- QR agendado
  insert into public.qr_codes (user_id, name, slug, type, content, destination, active_from)
  values (
    v_user, 'Black Friday', public.generate_qr_slug(),
    'url', '{"url": "https://exemplo.com.br/black-friday"}'::jsonb,
    'https://exemplo.com.br/black-friday', now() + interval '20 days'
  );

  -- QR com limite de leituras já atingido
  insert into public.qr_codes (user_id, name, slug, type, content, destination, scan_limit, scan_count)
  values (
    v_user, 'Cupom 100 primeiros', public.generate_qr_slug(),
    'url', '{"url": "https://exemplo.com.br/cupom"}'::jsonb,
    'https://exemplo.com.br/cupom', 100, 100
  );

  raise notice 'Seed concluído para o usuário %.', v_user;
end;
$$;
