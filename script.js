/* Portfolio en JavaScript natif. Aucune dépendance externe.
   Les commandes du terminal sont des actions de navigation locales.
   Ne jamais remplacer textContent par innerHTML pour afficher une saisie. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const EMAIL = 'selozaslan@outlook.com';
  const PHONE = '07 45 26 30 71';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMenu = window.matchMedia('(max-width: 640px)');
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const progress = document.getElementById('scroll-progress');
  const year = document.getElementById('year');

  if (year) year.textContent = String(new Date().getFullYear());

  // Menu utilisable au clavier, à la souris et au toucher.
  function closeMenu(restoreFocus = false) {
    if (!header || !menuButton) return;
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Ouvrir le menu');
    if (restoreFocus) menuButton.focus();
  }

  menuButton?.addEventListener('click', () => {
    if (!header) return;
    const isOpen = header.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  navLinks.forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header?.classList.contains('menu-open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (header && event.target instanceof Node && !header.contains(event.target)) closeMenu();
  });
  mobileMenu.addEventListener('change', () => closeMenu());

  // Progression + section active : une mise à jour par frame au maximum.
  let scrollScheduled = false;
  const trackedSections = Array.from(document.querySelectorAll('main > section[id]'));
  const sectionToNav = {
    projets: '#projets', competences: '#competences',
    experience: '#experience', formation: '#experience', contact: '#contact'
  };

  function updateScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const value = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    if (progress) progress.style.transform = `scaleX(${value})`;

    const offset = (header?.offsetHeight ?? 80) + 85;
    let currentId = '';
    for (const section of trackedSections) {
      if (section.getBoundingClientRect().top <= offset) currentId = section.id;
    }
    if (maxScroll > 0 && window.scrollY >= maxScroll - 4) currentId = 'contact';
    const activeHref = sectionToNav[currentId] ?? '';
    navLinks.forEach(link => {
      if (link.getAttribute('href') === activeHref) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollScheduled = false;
  }

  function scheduleScrollUpdate() {
    if (!scrollScheduled) {
      scrollScheduled = true;
      window.requestAnimationFrame(updateScroll);
    }
  }
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate);
  updateScroll();

  // Apparitions discrètes. Le contenu reste présent en cas d'absence de JS.
  let revealObserver = null;
  function revealAll() {
    revealObserver?.disconnect();
    document.querySelectorAll('.reveal').forEach(element => {
      element.classList.remove('pending');
      element.classList.add('is-visible');
    });
  }
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          entry.target.classList.add('is-visible');
          revealObserver?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.03, rootMargin: '0px 0px 25px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top >= window.innerHeight) element.classList.add('pending');
      else element.classList.add('is-visible');
      revealObserver.observe(element);
    });
  }
  reducedMotion.addEventListener('change', event => { if (event.matches) revealAll(); });
  window.addEventListener('beforeprint', revealAll);

  // Filtres des compétences : boutons standards, pas de faux onglets ARIA.
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const skills = Array.from(document.querySelectorAll('.skill-card'));
  const skillsGrid = document.querySelector('.skills-grid');
  const filterStatus = document.getElementById('filter-status');
  const toolbar = document.getElementById('skills-toolbar');
  if (toolbar) toolbar.hidden = false;

  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    let visibleCount = 0;
    filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    skillsGrid?.classList.toggle('is-filtered', category !== 'all');
    skills.forEach(card => {
      const categories = (card.dataset.category ?? '').split(' ');
      card.hidden = category !== 'all' && !categories.includes(category);
      if (!card.hidden) {
        visibleCount += 1;
        card.classList.remove('pending');
        card.classList.add('is-visible');
      }
    });
    if (filterStatus) filterStatus.textContent = `${visibleCount} domaines affichés.`;
    scheduleScrollUpdate();
  }));

  // Les détails natifs restent consultables sans JavaScript.
  document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', scheduleScrollUpdate);
  });

  // Message de confirmation accessible, sans fenêtre bloquante.
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4500);
  }

  document.getElementById('copy-email')?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Presse-papiers indisponible');
      await navigator.clipboard.writeText(EMAIL);
      showToast('Adresse e-mail copiée.');
    } catch {
      // Ouverture locale ou permission refusée : sélectionner le texte visible.
      const emailLink = document.querySelector('.contact-email-row > a');
      if (emailLink) {
        const range = document.createRange();
        range.selectNodeContents(emailLink);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      showToast('Copie automatique indisponible : l’adresse est sélectionnée pour la copier.');
    }
  });

  // Terminal simulé : saisies rendues en texte brut, historique borné.
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  const history = [];
  let historyIndex = 0;
  let savedInput = '';

  function goTo(id) {
    const destination = document.getElementById(id);
    if (!destination) return;
    destination.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    // Le titre reçoit le focus sans déplacer une deuxième fois la page.
    const heading = destination.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
    }
  }

  function appendOutput(command, response) {
    if (!output) return;
    const entry = document.createElement('div');
    entry.className = 'terminal-entry';
    const echo = document.createElement('p');
    echo.className = 'terminal-echo';
    echo.textContent = `visiteur@portfolio ~ $ ${command}`;
    const result = document.createElement('p');
    result.className = 'terminal-response';
    result.textContent = response;
    entry.append(echo, result);
    output.append(entry);
    while (output.children.length > 40) output.firstElementChild?.remove();
    output.scrollTop = output.scrollHeight;
  }

  const commands = {
    help: () => 'Commandes disponibles :\nwhoami     Présentation\nskills     Domaines techniques\nprojets    Aller aux projets\nparcours   Aller aux expériences\nformation  Voir les diplômes\ncontact    Mes coordonnées\ncv         Télécharger le CV\nclear      Effacer le terminal\n\n↑ / ↓ : historique · Tab : compléter une commande',
    whoami: () => 'Selahattin OZASLAN\nAdministrateur systèmes & réseaux\nBac +5 — Mention Bien\nMantes-la-Jolie · Île-de-France\nRecherche CDI',
    skills: () => 'Systèmes : Windows Server, Linux, AD, GPO\nVirtualisation : VMware, Hyper-V\nRéseaux : Cisco, Aruba, VLAN\nSécurité : PacketFence, NSX, Stormshield, Wallix\nIdentités : Microsoft 365, Entra ID, Intune\nSupervision : Centreon, PRTG\n\nLes autres technologies sont présentées dans la section Compétences.',
    projets: () => { goTo('projets'); return 'Ouverture des projets issus de mes alternances.'; },
    parcours: () => { goTo('experience'); return 'Ouverture de mon parcours professionnel.'; },
    formation: () => { goTo('formation'); return 'Ouverture des diplômes et formations.'; },
    contact: () => `E-mail : ${EMAIL}\nTéléphone : ${PHONE}\nRecherche CDI en Île-de-France.`,
    cv: () => {
      const cvLink = document.querySelector('[data-cv]');
      if (!cvLink) return 'Le lien du CV est indisponible.';
      cvLink.click();
      return 'Ouverture du lien de téléchargement du CV.';
    },
    clear: () => { output?.replaceChildren(); return ''; }
  };

  function runCommand(value) {
    if (typeof value !== 'string') return;
    const raw = value.trim().slice(0, 160);
    if (!raw) return;
    const normalized = raw.toLowerCase();
    if (history.at(-1) !== raw) history.push(raw);
    if (history.length > 50) history.shift();
    historyIndex = history.length;
    savedInput = '';
    if (input) input.value = '';
    const known = Object.prototype.hasOwnProperty.call(commands, normalized);
    const response = known ? commands[normalized]() : `Commande inconnue : ${raw}\nTapez help pour afficher les commandes.`;
    if (normalized !== 'clear') appendOutput(raw, response);
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (input) runCommand(input.value);
  });
  document.querySelectorAll('[data-command]').forEach(button => {
    button.addEventListener('click', () => runCommand(button.dataset.command));
  });
  input?.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      if (historyIndex === history.length) savedInput = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? '';
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = historyIndex === history.length ? savedInput : history[historyIndex];
    } else if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) {
      const matches = Object.keys(commands).filter(command => command.startsWith(input.value.trim().toLowerCase()));
      // Pas de piège clavier : Tab ne reste dans le champ que pour une complétion unique.
      if (matches.length === 1 && matches[0] !== input.value.trim()) {
        event.preventDefault();
        input.value = matches[0];
      }
    }
  });
})();
