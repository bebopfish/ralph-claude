import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '仪表盘', icon: '⚡' },
  { to: '/prd', label: 'PRD 管理', icon: '📋' },
  { to: '/progress', label: '进度记录', icon: '📝' },
  { to: '/git', label: 'Git 历史', icon: '🔀' },
];

export default function Sidebar() {
  return (
    <aside className="w-48 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">Ralph Claude</h1>
        <p className="text-xs text-slate-400 mt-0.5">AI 自动编程循环</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
