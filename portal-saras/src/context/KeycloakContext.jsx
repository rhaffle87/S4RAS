// KeycloakContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import Keycloak from 'keycloak-js';

const KeycloakContext = createContext();

export const useKeycloak = () => useContext(KeycloakContext);

export const KeycloakProvider = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [persona, setPersona] = useState('student');
  const [roleLabel, setRoleLabel] = useState('Mahasiswa');
  const [sipExtension, setSipExtension] = useState('1001');
  const [sipSecret, setSipSecret] = useState('');
  const [iceServers, setIceServers] = useState([{ urls: 'stun:192.168.10.202:3478' }]);
  const [department, setDepartment] = useState('Teknik Informatika');
  const [storageQuota, setStorageQuota] = useState('15GB');
  const [moodleCohort, setMoodleCohort] = useState('KOM-401-2026');

  useEffect(() => {
    if (keycloak && authenticated) {
      const realmRoles = [
        ...(keycloak.realmAccess?.roles || []),
        ...(keycloak.tokenParsed?.realm_access?.roles || [])
      ];
      const clientRoles = [
        ...(keycloak.resourceAccess?.['front-end']?.roles || []),
        ...(keycloak.tokenParsed?.resource_access?.['front-end']?.roles || [])
      ];
            const username = (profile?.username || keycloak.tokenParsed?.preferred_username || '').toLowerCase();
      const hasAdmin =
        realmRoles.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'super admin' || r.toLowerCase() === 'administrator') ||
        clientRoles.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'super admin') ||
        username === 'admin' || username === 'dev1';

      const hasTeacher =
        realmRoles.some(r => r.toLowerCase() === 'dosen' || r.toLowerCase() === 'teacher') ||
        username === 'teacher1';

      const hasStudent =
        realmRoles.some(r => r.toLowerCase() === 'mahasiswa' || r.toLowerCase() === 'student') ||
        username === 'student1';

      setIsAdmin(hasAdmin);
      setIsTeacher(!hasAdmin && hasTeacher);
      setIsStudent(!hasAdmin && !hasTeacher && hasStudent);

      const computedPersona = (username === 'testuser' || hasAdmin) ? 'dev' : hasTeacher ? 'teacher' : 'student';
      setPersona(computedPersona);

      const computedRoleLabel = (username === 'testuser') ? 'Research Fellow' : hasAdmin ? 'Administrator' : hasTeacher ? 'Dosen' : 'Mahasiswa';
      setRoleLabel(computedRoleLabel);

      // Extract dynamic token attributes mapped from Keycloak S4RAS Realm
      const tp = keycloak.tokenParsed || {};
      const dynExt = tp.sip_extension || (username === 'testuser' ? '1079348' : hasAdmin ? '1003' : hasTeacher ? '1002' : '1001');
      const dynSecret = tp.sip_secret || '';
      const dynDept = tp.department || (username === 'testuser' ? 'Research Fellowship / S4RAS' : hasAdmin ? 'Rektorat & Administrasi Sistem' : hasTeacher ? 'Teknik Elektro & Telematika' : 'Teknik Informatika');
      const dynQuota = tp.storage_quota || (username === 'testuser' ? '200GB' : hasAdmin ? '500GB' : hasTeacher ? '50GB' : '15GB');
      const dynCohort = tp.moodle_cohort || (username === 'testuser' ? 'RESEARCH-FELLOW-2026' : hasAdmin ? 'ADMIN-CLUSTER' : hasTeacher ? 'FACULTY-2026' : 'KOM-401-2026');

      setSipExtension(dynExt);
      setSipSecret(dynSecret);
      setDepartment(dynDept);
      setStorageQuota(dynQuota);
      setMoodleCohort(dynCohort);
    } else {
      setIsAdmin(false);
      setIsTeacher(false);
      setIsStudent(false);
      setPersona('student');
      setRoleLabel('Mahasiswa');
      setSipExtension('1001');
      setSipSecret('');
      setDepartment('Teknik Informatika');
      setStorageQuota('15GB');
      setMoodleCohort('KOM-401-2026');
    }
  }, [keycloak, authenticated, profile]);

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
      console.debug('[Keycloak] Local development detected — bypassing Keycloak and using mock profile');
      
      const mockProfile = {
        username: 'testuser',
        email: 'civitas@s4ras.site',
        firstName: 'Rafi',
        lastName: 'Rabbani',
        attributes: {
          role: ['admin'],
          sip_extension: ['1079348'],
          sip_secret: ['dev-mock-secret'],
          department: ['Research Fellowship / S4RAS'],
          storage_quota: ['200GB'],
          moodle_cohort: ['RESEARCH-FELLOW-2026']
        }
      };

      const mockKeycloak = {
        realmAccess: { roles: ['admin'] },
        resourceAccess: { 'front-end': { roles: ['admin'] } },
        token: 'mock-token',
        tokenParsed: {
          preferred_username: 'testuser',
          name: 'Sivitas Peneliti',
          email: 'civitas@s4ras.site',
          sip_extension: '1079348',
          sip_secret: 'dev-mock-secret',
          department: 'Research Fellowship / S4RAS',
          storage_quota: '200GB',
          moodle_cohort: 'RESEARCH-FELLOW-2026'
        },
        loadUserProfile: async () => mockProfile,
        login: () => {
          console.debug('[Keycloak] Mock login triggered');
          localStorage.setItem('saras-mock-authed', 'true');
          window.location.reload();
        },
        logout: () => {
          console.debug('[Keycloak] Mock logout triggered');
          localStorage.setItem('saras-mock-authed', 'false');
          window.location.reload();
        }
      };

      setKeycloak(mockKeycloak);
      
      const authed = localStorage.getItem('saras-mock-authed') !== 'false';
      if (authed) {
        setProfile(mockProfile);
        setAuthenticated(true);
      } else {
        setProfile(null);
        setAuthenticated(false);
      }
      setInitialized(true);

      // Auto login if not authenticated
      if (!authed) {
        setTimeout(() => {
          console.debug('[Keycloak] Auto logging in mock developer');
          mockKeycloak.login();
        }, 1000);
      }

      return;
    }

    const keycloakInstance = new Keycloak({
      url: 'https://sso.s4ras.site', 
      realm: 'S4RAS',
      clientId: 'front-end',
    });

    const isCallback = () => {
      try {
        const h = window.location.hash || '';
        const s = window.location.search || '';
        return h.includes('code=') || h.includes('session_state') || s.includes('code=') || s.includes('session_state');
      } catch (e) {
        return false;
      }
    };

    // Force HTTPS on production domain
    if (window.location.hostname === 'portal.s4ras.site' && window.location.protocol === 'http:') {
      window.location.replace('https://portal.s4ras.site' + window.location.pathname + window.location.search);
      return;
    }

    const getRedirectUri = () => {
      if (window.location.hostname === 'portal.s4ras.site') {
        return 'https://portal.s4ras.site/';
      }
      return window.location.origin + '/';
    };

    const redirectUri = getRedirectUri();

    console.debug('[Keycloak] init start', { url: window.location.href, redirectUri, isCallback: isCallback() });

    // use check-sso so we can detect state first and only call login when appropriate
    keycloakInstance.onReady = () => {};

    // add listeners for debugging
    keycloakInstance.onAuthSuccess = () => console.debug('[Keycloak] onAuthSuccess');
    keycloakInstance.onAuthError = (err) => console.error('[Keycloak] onAuthError', err);
    keycloakInstance.onAuthRefreshSuccess = () => console.debug('[Keycloak] onAuthRefreshSuccess');
    keycloakInstance.onAuthRefreshError = () => console.error('[Keycloak] onAuthRefreshError');
    keycloakInstance.onTokenExpired = () => console.debug('[Keycloak] onTokenExpired');

    keycloakInstance.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256',
      redirectUri
    }).then(auth => {
      console.debug('[Keycloak] init finished', { authenticated: auth, token: !!keycloakInstance.token });
      setKeycloak(keycloakInstance);
      setAuthenticated(!!auth);
      setInitialized(true);

      // If not authenticated and this is NOT the OIDC callback, trigger login.
      // This avoids calling login() repeatedly while the browser is finishing the redirect
      if (!auth && !isCallback()) {
        console.debug('[Keycloak] not authenticated and not callback — calling login()');
        keycloakInstance.login({ redirectUri });
      } else if (auth) {
        console.debug('[Keycloak] authenticated after init', { tokenParsed: keycloakInstance.tokenParsed });
        keycloakInstance.loadUserProfile().then(profileData => {
          setProfile(profileData);
          fetch('/api/me/context', {
            headers: { Authorization: `Bearer ${keycloakInstance.token}` }
          })
            .then(res => res.ok ? res.json() : null)
            .then(ctx => {
              if (ctx?.telephony) {
                if (ctx.telephony.extension) setSipExtension(ctx.telephony.extension);
                if (ctx.telephony.secret) setSipSecret(ctx.telephony.secret);
                if (ctx.telephony.iceServers) setIceServers(ctx.telephony.iceServers);
              }
            })
            .catch(err => console.debug('[Keycloak] Context fetch failed', err));
        }).catch(err => {
          console.warn('[Keycloak] profile fetch failed', err);
        });
      }

      // Clean up URL (remove code/state from hash) after init to avoid re-processing
      if (isCallback()) {
        try {
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          // ignore
        }
      }
    }).catch((error) => {
      console.error('Keycloak initialization failed:', error);
      setInitialized(true);
    });

    // Cleanup on component unmount
    return () => {
      setKeycloak(null);
      setAuthenticated(false);
      setInitialized(false);
      setProfile(null);
    };
  }, []);

  // Synchronize dynamic telephony credentials and TURN iceServers from server
  useEffect(() => {
    if (authenticated && keycloak?.token) {
      fetch('/api/me/context', {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.telephony) {
            if (data.telephony.secret) setSipSecret(data.telephony.secret);
            if (data.telephony.extension) setSipExtension(data.telephony.extension);
            if (Array.isArray(data.telephony.iceServers) && data.telephony.iceServers.length > 0) {
              setIceServers(data.telephony.iceServers);
            }
          }
        })
        .catch(() => {});
    }
  }, [authenticated, keycloak?.token]);

  const logout = () => {
    if (keycloak) {
      keycloak.logout();
    }
  };

  return (
    <KeycloakContext.Provider value={{
      keycloak, authenticated, initialized, profile, logout,
      isAdmin, isTeacher, isStudent, persona, roleLabel,
      sipExtension, sipSecret, iceServers, department, storageQuota, moodleCohort
    }}>
      {children}
    </KeycloakContext.Provider>
  );
};
