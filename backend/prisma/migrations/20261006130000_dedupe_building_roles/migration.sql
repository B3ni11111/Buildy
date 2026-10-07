-- Each member holds one role per building. Older join code added a `resident` row even
-- when the member already had a higher role (e.g. after re-joining). Drop those extras.
DELETE FROM "users_roles" r
WHERE r."role" = 'resident'
  AND EXISTS (
    SELECT 1 FROM "users_roles" other
    WHERE other."user_id" = r."user_id"
      AND other."building_id" = r."building_id"
      AND other."role" <> 'resident'
  );
