import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '@/lib/firebase/services';
import { localScansService } from '@/lib/storage/localScans';
import type { ScanResult, Stats, FilterType } from '@/types';

export function useScans(userId?: string) {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState<Stats>({ qrScans: 0, linkScans: 0, dangerousBlocked: 0, cautionBlocked: 0 });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const loadScans = useCallback(async () => {
    setLoading(true);
    try {
      let results: ScanResult[];
      if (userId) {
        // Logged in: load from Firebase
        results = await firebaseService.getUserScans(userId);
      } else {
        // Guest: load from localStorage
        results = localScansService.getScansList();
      }
      setScans(results);
      applyFilter(results, activeFilter);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, activeFilter]);

  const loadStats = useCallback(async () => {
    try {
      let statsData: Stats;
      if (userId) {
        // Logged in: calculate stats from user's scans
        const userScans = await firebaseService.getUserScans(userId);
        let qrScans = 0;
        let linkScans = 0;
        let dangerousBlocked = 0;
        let cautionBlocked = 0;

        userScans.forEach((scan) => {
          if (scan.type === 'qr') qrScans++;
          if (scan.type === 'link') linkScans++;
          if (scan.riskLevel === 'danger') dangerousBlocked++;
          if (scan.riskLevel === 'caution') cautionBlocked++;
        });

        statsData = { qrScans, linkScans, dangerousBlocked, cautionBlocked };
      } else {
        // Guest: load from localStorage
        statsData = localScansService.getStats();
      }
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [userId]);

  const applyFilter = useCallback((scanList: ScanResult[], filter: FilterType) => {
    if (filter === 'all') {
      setFilteredScans(scanList);
    } else {
      setFilteredScans(scanList.filter((scan) => scan.type === filter));
    }
  }, []);

  const filterScans = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    applyFilter(scans, filter);
  }, [scans, applyFilter]);

  const addScan = useCallback(async (scan: ScanResult) => {
    // Update local state immediately
    const newScans = [scan, ...scans];
    setScans(newScans);
    applyFilter(newScans, activeFilter);

    // Save to appropriate storage
    if (userId) {
      // Logged in: save to Firebase
      try {
        await firebaseService.saveScan({
          ...scan,
          userId,
        });
      } catch (error) {
        console.error('Error saving scan to Firebase:', error);
      }
    } else {
      // Guest: save to localStorage
      localScansService.saveScan(scan);
    }

    // Refresh stats
    await loadStats();
  }, [scans, activeFilter, applyFilter, userId, loadStats]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    scans,
    filteredScans,
    stats,
    loading,
    activeFilter,
    filterScans,
    addScan,
    refreshScans: loadScans,
    refreshStats: loadStats,
  };
}
