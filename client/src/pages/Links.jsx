import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../components/ui/dialog';

const baseUrl =
  import.meta.env.VITE_PUBLIC_BASE_URL || 'http://localhost:5000';

export default function Links() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    destinationUrl: '',
    shortCode: '',
  });
  const [error, setError] = useState('');
  const [qr, setQr] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async () => {
    try {
      const response = await api.get('/links', {
        params: {
          search,
          page,
          limit: 8,
        },
      });

      setItems(response.data.items || []);
      setPages(response.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load links');
    }
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const create = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.post('/links', {
        destinationUrl: form.destinationUrl,
        shortCode: form.shortCode || undefined,
      });

      setForm({
        destinationUrl: '',
        shortCode: '',
      });
      setPage(1);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not create link',
      );
    }
  };

  const removeLink = async (id) => {
    if (!window.confirm('Delete this link?')) {
      return;
    }

    try {
      await api.delete(`/links/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete link');
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError('Could not copy link');
    }
  };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Link library</h1>
        <p className="text-zinc-500">
          Create, copy, inspect and delete your short links.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create short link</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={create}
            className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
          >
            <Input
              type="url"
              placeholder="https://example.com"
              value={form.destinationUrl}
              onChange={(event) =>
                setForm({
                  ...form,
                  destinationUrl: event.target.value,
                })
              }
              required
            />

            <Input
              placeholder="Custom slug (optional)"
              value={form.shortCode}
              onChange={(event) =>
                setForm({
                  ...form,
                  shortCode: event.target.value,
                })
              }
            />

            <Button type="submit">Create</Button>
          </form>

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="Search links…"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-zinc-500">
              No links found.
            </CardContent>
          </Card>
        ) : (
          items.map((link) => {
            const url = `${baseUrl}/r/${link.shortCode}`;

            return (
              <Card key={link._id}>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{url}</p>
                    <p className="truncate text-sm text-zinc-500">
                      {link.destinationUrl}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(url)}
                    >
                      Copy
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      onClick={() => setQr(url)}
                    >
                      QR
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.location.assign(
                          `/analytics?link=${link._id}`,
                        )
                      }
                    >
                      Analytics
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeLink(link._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </Button>

        <span className="text-sm">
          {page} / {pages}
        </span>

        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={page >= pages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>

      <Dialog
        open={Boolean(qr)}
        onOpenChange={(open) => {
          if (!open) {
            setQr(null);
          }
        }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>QR code</DialogTitle>
          </DialogHeader>

          {qr && (
            <div className="grid place-items-center gap-4 p-6">
              <QRCodeSVG value={qr} size={240} />
              <p className="break-all text-center text-sm">{qr}</p>
              <DialogClose render={<Button variant="outline" />}>
                Close
              </DialogClose>
            </div>
          )}
        </DialogPopup>
      </Dialog>
    </div>
  );
}
