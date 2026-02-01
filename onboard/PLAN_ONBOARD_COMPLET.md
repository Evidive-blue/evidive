# 📄 Prompts précis par page — Agents Parallèles

---

> ⚡️ Pour chaque agent, tu travailles *uniquement* sur une page, selon la liste ci-dessous. Applique à la lettre les consignes suivantes :  
> - **Nettoie** l’UX/UI pour clarté, logique, accessibilité, pas de décor inutile.
> - **Vérifie** chaque fonctionnalité : code, intention, interactions — ne conserve rien qui ne sert à rien ou n’est pas cohérent.
> - **Améliore** la lisibilité, nommage, structure, pratiques modernes.
> - **Signale explicitement** en fin de prompt tout élément incohérent ou inutile détecté.
>  
> Toutes tes réponses doivent répondre à ces exigences strictes pour optimiser la qualité finale.

---

## Exemples de prompt agent à donner (1 prompt par page) :

---

### Prompt — Création de compte Plongeur

> Implémente la page « Création de compte Plongeur » avec les exigences suivantes :
> - Formulaire épuré et clair demandant : email, mot de passe, prénom, nom.
> - Vérification obligatoire de l’adresse email (syntaxe et unicité).
> - Après validation, création compte et connexion auto.
> - Authentification Google & Facebook **désactivées**, ne pas montrer.
> - Lien mot de passe oublié visible.
> - Réinitialisation via page dédiée seulement.
> - Système de blacklist email (blocage côté front ET back).
>
> **Vérifie** que chaque champ sert l’inscription, pas d’élément superflu.
>
> **À la fin, liste toute incohérence, champ inutile ou non-justifié.**

---

### Prompt — Inscription Centre de plongée

> Implémente la page d’inscription Centre de plongée, en multi-étapes claires :
> - Étapes distinctes : nom, prénom, nom public, téléphone, adresse, ville, code postal, société (optionnel).
> - Après soumission : statut « en attente », envoi d’un email accusé de réception.
> - Validation/approbation automatique par admin (mail lors approve/refus, notification complète).
>
> **UX : chaque étape ne montre que les champs nécessaires.**
>
> **Signale tout champ inutile/illogique en fin de prompt.**

---

### Prompt — Profil Utilisateur

> Refonte page profil utilisateur : 
> - Affiche infos utilisateur essentielles.
> - Upload avatar + image couverture.
> - Modification infos profil (tous champs pertinents).
> - Modification mot de passe.
> - Accès page notifications & page confidentialité.
> - Sélecteur langue d’interface propre.
>
> **Supprime/souligne tout bloc ou champ inutile ; explique si incohérence.**

---

### Prompt — Tableau de bord Plongeur

> Propose un dashboard plongeur qui synthétise :
> - Réservations à venir.
> - Passées (historiques).
> - Accès rapide (CTA) actions principales.
>
> **Aucun widget/onglet inutile. Explique tout bloc qui n’aurait pas de logique !**

---

### Prompt — Réservations Plongeur

> Page réservations côté plongeur :
> - Liste, filtrage par statut.
> - Détails : infos réservation, paiement, commentaires.
> - Ajout simple calendrier Google.
> - Si annulation interdite : message UX clair (pas de bouton superflu).
>
> **Vérifie chaque possibilité d’action, simplifie si besoin.**

---

### [Continue chaque section…]
> Pour chaque page, crée un prompt strict, exhaustif, professionel à destination d’un développeur front moderne.
> Toujours intégrer :
> - Les champs/fonctions obligatoires, élémentaires.
> - Toute contrainte, contrôle, ou différenciation UX à respecter.
> - Instructions de vérification/explicitation finale (ex : liste de tout ce qui pourrait ne servir à rien).

---

**⚠️ Pour tout agent, à la fin, output explicitement les points qui n’apportent rien ou n’ont pas de logique ou sont ambiguës pour retour / clarification :**
> `Points à revoir / incohérences :`

---

### (Ci-dessous la liste complète à transformer en prompts :)

// ↓ POUR CHAQUE PAGE, génère un prompt sur ce modèle strict. Utilise le détail des éléments nécessaires (voir ci-dessus), adapte à la page, reprends les fonctionnalités listées seulement si elles sont justifiées et structurées.  

---

- Création de compte Plongeur…
- Inscription Centre de plongée…
- Profil Utilisateur…
- Tableau de bord Plongeur…
- Réservations Plongeur…
- Avis Plongeur…
- Paramètres Plongeur…
- Tableau de bord Centre…
- Profil Centre de plongée…
- Gestion des plongées/services (Centre)…
- Calendrier & Disponibilités (Centre)…
- Gestion des réservations (Centre)…
- Avis reçus (Centre)…
- Statistiques Centre…
- Paramètres Centre…
- Réservation (Booking)…
- Paiement…
- Commissions…
- Coupons & Réductions…
- Configuration Emails…
- Templates Emails (Client & Centre)…
- Paramétrage SMS…
- Google Calendar…
- Google Maps…
- Catégories de plongée…
- Équipe Centre (Workers)…
- Conditions Générales (CGV)…
- Multilingue (i18n)…
- Admin Dashboard…
- Avis & Notes…
- Notifications In-App…
- Annulation & Remboursement…
- Sécurité & Logs…
- Base de données…
- Planning projet…

---

**Rappel pour chaque agent :**  
1. Implémente uniquement cette page selon prompt.  
2. Nettoie, vérifie, structure, explicite tout doute.  
3. Répertorie ce qui ne correspond pas/est inutile.  

---
