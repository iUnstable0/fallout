import { type ReactNode, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import Frame from '@/components/shared/Frame'
import FlashMessages from '@/components/FlashMessages'

interface MenuLink {
  type: 'link'
  title: string
  path: string
}

interface MenuSection {
  type: 'section'
  title: string
  items: { title: string; path: string }[]
}

type MenuItem = MenuLink | MenuSection

function soupHref(href: string) {
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}soup=true`
}

function NavLink({
  href,
  active,
  children,
  subpage = false,
}: {
  href: string
  active: boolean
  children: ReactNode
  subpage?: boolean
}) {
  return (
    <Link
      href={soupHref(href)}
      className={`block px-3 py-1.5 ${subpage ? 'rounded-r' : 'rounded'} ${active ? 'bg-brown text-light-brown font-semibold' : ''}`}
    >
      {children}
    </Link>
  )
}

function CollapsibleSection({
  title,
  items,
  currentPath,
}: {
  title: string
  items: { title: string; path: string }[]
  currentPath: string
}) {
  const storageKey = `docs-nav-${title}`
  const hasActiveChild = items.some((item) => currentPath === item.path)
  const [open, setOpen] = useState(() => {
    if (hasActiveChild) return true
    const stored = localStorage.getItem(storageKey)
    return stored !== null ? stored === 'true' : true
  })

  function toggle() {
    const next = !open
    setOpen(next)
    localStorage.setItem(storageKey, String(next))
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-3 py-1.5 font-bold text-left cursor-pointer"
      >
        {title}
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>&#8250;</span>
      </button>
      {open && (
        <div className="ml-3 border-l-2 border-dark-brown/20 flex flex-col gap-0.5 mt-0.5">
          {items.map((item) => (
            <NavLink key={item.path} href={item.path} active={currentPath === item.path} subpage>
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MarkdownLayout({ children }: { children: ReactNode }) {
  const { menu_items, index_title } = usePage<{ menu_items: MenuItem[]; index_title: string }>().props
  const currentPath = usePage().url.split('?')[0]

  return (
    <div className="relative min-h-screen">
      <aside className="fixed top-0 left-0 z-10 flex h-screen p-4 w-90">
        <Frame className="flex-1">
          <nav className="flex flex-col gap-0.5 p-2 overflow-y-auto h-full">
            <Link href="/path" className="block px-3 py-1.5">
              ← Back to the Path
            </Link>
            <hr className="my-1 border-dark-brown/20" />
            <NavLink href="/docs" active={currentPath === '/docs'}>
              {index_title}
            </NavLink>
            {menu_items.map((item, i) =>
              item.type === 'section' ? (
                <CollapsibleSection key={i} title={item.title} items={item.items} currentPath={currentPath} />
              ) : (
                <NavLink key={item.path} href={item.path} active={currentPath === item.path}>
                  {item.title}
                </NavLink>
              ),
            )}
          </nav>
        </Frame>
      </aside>
      <div className="ml-90">
        <FlashMessages />
        <main className="max-w-3xl py-8 lg:ml-20">{children}</main>
      </div>
    </div>
  )
}
