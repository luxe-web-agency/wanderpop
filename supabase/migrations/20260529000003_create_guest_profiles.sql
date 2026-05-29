create schema if not exists private;

create or replace function private.create_guest_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, account_type)
  values (new.id, 'guest')
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_guest_profile on auth.users;

create trigger on_auth_user_created_create_guest_profile
  after insert on auth.users
  for each row execute function private.create_guest_profile_for_user();
