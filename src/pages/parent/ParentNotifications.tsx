import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SchoolNotification } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Bell, CheckCircle, RefreshCw } from 'lucide-react';

export const ParentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications({ target_role: 'parent' });
      setNotifications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <Bell className="w-7 h-7" /> Institutional Announcements & Notices
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Realtime school broadcasts, academic milestone alerts, and event notifications
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={loadNotifications}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH
        </BrutalButton>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-w-3xl">
        {notifications.map((n) => (
          <BrutalCard
            key={n.id}
            size="medium"
            accent={n.is_read ? 'yellow' : 'mint'}
            className="p-4"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0F172A] mb-2">
              <span className="font-black text-sm text-[#0F172A] uppercase flex items-center gap-2">
                <Bell className="w-4 h-4" /> {n.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-[9px] font-black px-1.5 py-0.5 bg-[#0F172A] text-white uppercase shadow-[1px_1px_0px_#FDE68A]"
                  >
                    MARK READ
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              {n.message}
            </p>

            <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-bold uppercase">
              <span>Audience: {n.target_role || 'All School'}</span>
              <span>Ref: {n.id}</span>
            </div>
          </BrutalCard>
        ))}

        {notifications.length === 0 && !loading && (
          <div className="p-8 border-2 border-[#0F172A] bg-white text-center shadow-[4px_4px_0px_#0F172A]">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <div className="text-xs font-bold text-slate-500">No new notices at this time.</div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ParentNotifications;
