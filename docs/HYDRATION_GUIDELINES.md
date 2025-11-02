# Hydration Error Prevention Guidelines

## Common Hydration Errors and Solutions

### 1. Invalid HTML Nesting

#### ❌ Problem: Block elements inside inline elements
```tsx
// This causes hydration errors
<p className="text-xs text-gray-600">
  {loading ? (
    <div className="loading-skeleton"></div>  // ❌ div inside p
  ) : (
    'Some text'
  )}
</p>
```

#### ✅ Solution: Use appropriate container elements
```tsx
// Use div instead of p when containing block elements
<div className="text-xs text-gray-600">
  {loading ? (
    <div className="loading-skeleton"></div>  // ✅ div inside div
  ) : (
    'Some text'
  )}
</div>
```

### 2. Interactive Elements Nesting

#### ❌ Problem: Nested interactive elements
```tsx
<button>
  <button>Click me</button>  // ❌ button inside button
</button>

<a href="/link1">
  <a href="/link2">Link</a>  // ❌ anchor inside anchor
</a>
```

#### ✅ Solution: Avoid nesting interactive elements
```tsx
<div>
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

### 3. Server/Client Mismatch

#### ❌ Problem: Different content on server vs client
```tsx
// This can cause hydration mismatches
<div>
  {typeof window !== 'undefined' ? 'Client' : 'Server'}
</div>
```

#### ✅ Solution: Use useEffect for client-only content
```tsx
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

return (
  <div>
    {isClient ? 'Client content' : 'Loading...'}
  </div>
);
```

## HTML Element Nesting Rules

### Block elements that cannot be inside `<p>`:
- `<div>`
- `<section>`
- `<article>`
- `<header>`
- `<footer>`
- `<main>`
- `<aside>`
- `<nav>`
- `<ul>`, `<ol>`, `<li>`
- `<h1>` through `<h6>`
- `<blockquote>`
- `<pre>`
- `<form>`
- `<table>`

### Safe alternatives to `<p>` when containing block elements:
- `<div>` - Generic container
- `<span>` - For inline content only
- `<section>` - For semantic sections
- `<article>` - For standalone content

## Best Practices

1. **Use semantic HTML correctly**
2. **Test with React StrictMode enabled**
3. **Use browser dev tools to check for hydration warnings**
4. **Validate HTML structure**
5. **Use TypeScript for better type safety**

## Debugging Hydration Errors

1. Check browser console for specific error messages
2. Look for the component and line number in the error
3. Verify HTML nesting rules
4. Ensure server and client render the same content
5. Use React DevTools to inspect component tree