# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Supabase Setup

1. Create a project at `https://app.supabase.com`.
2. Go to Settings → API and copy your Project URL and anon key.
3. Create a `.env` file in the project root with:

```
PUBLIC_SUPABASE_URL=your-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Visit `/api/me` or the home page to see the current user JSON when authenticated.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
