import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, Chip, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { listDevUsers } from '../utils/api';
import { DevUser, signInAsDevUser } from '../utils/devLogin';

const ROLE_LABEL: Record<string, string> = {
  committee_head: 'Committee head',
  management_company: 'Management company',
  resident: 'Resident',
};

/** Dev only: "Sign in as" one of the seeded mock users (shown when VITE_DEV_LOGIN=true). English only on purpose. */
export default function DevSignIn() {
  const [users, setUsers] = useState<DevUser[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listDevUsers()
      .then(setUsers)
      .catch(() => setError(true));
  }, []);

  const describe = (u: DevUser) =>
    [
      ...u.roles.map((r) => `${ROLE_LABEL[r.role] ?? r.role} · ${r.building}`),
      ...u.apartments.map((a) => `Apt ${a.number} ${a.relationType === 'tenant' ? 'renter' : 'owner'} · ${a.building}`),
    ].join('\n') || 'Not in any building';

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, borderStyle: 'dashed', textAlign: 'start' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Dev: sign in as…
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Local testing only. Mock users, no Google login.
        </Typography>
        {error && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Dev login is off in the backend (DEV_LOGIN).
          </Alert>
        )}
        {users && (
          <List dense sx={{ mt: 1 }} data-testid="dev-users">
            {users.map((u) => (
              <ListItemButton key={u.sub} onClick={() => signInAsDevUser(u)} sx={{ borderRadius: 2 }} data-testid={`dev-user-${u.sub}`}>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {u.name ?? u.sub}
                      {u.isAdmin && <Chip size="small" label="Admin" color="primary" />}
                    </Box>
                  }
                  secondary={describe(u)}
                  slotProps={{ secondary: { sx: { whiteSpace: 'pre-line' } } }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
