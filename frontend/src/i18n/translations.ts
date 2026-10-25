import { LanguageCode } from '../types/language';

export type TranslationKey =
  | 'common.continue'
  | 'common.finish'
  | 'common.getStarted'
  | 'common.welcomeToBuildy'
  | 'common.edit'
  | 'common.save'
  | 'common.cancel'
  | 'language.title'
  | 'language.subtitle'
  | 'language.confirm'
  | 'name.title'
  | 'name.subtitle'
  | 'name.placeholder'
  | 'name.confirm'
  | 'home.title'
  | 'home.tagline'
  | 'home.signInPrompt'
  | 'home.signInButton'
  | 'dashboard.welcome'
  | 'summary.open'
  | 'summary.nothingOpen'
  | 'summary.seeAll'
  | 'summary.ofGoal'
  | 'summary.notOpened'
  | 'summary.yourPart'
  | 'summary.allPaid'
  | 'summary.details'
  | 'summary.people'
  | 'summary.managedBy'
  | 'nav.home'
  | 'nav.issues'
  | 'nav.money'
  | 'nav.docs'
  | 'nav.people'
  | 'nav.label'
  | 'language.partial'
  | 'layout.presetsTitle'
  | 'layout.preset.head'
  | 'layout.preset.resident'
  | 'layout.preset.essentials'
  | 'layout.preset.everything'
  | 'layout.presetDesc.head'
  | 'layout.presetDesc.resident'
  | 'layout.presetDesc.essentials'
  | 'layout.presetDesc.everything'
  | 'layout.presetConfirmTitle'
  | 'layout.presetConfirmText'
  | 'layout.presetApply'
  | 'payments.slideToPay'
  | 'payments.sending'
  | 'payments.paidThanks'
  | 'door.hold'
  | 'door.tapToCopy'
  | 'door.copied'
  | 'greeting.morning'
  | 'greeting.afternoon'
  | 'greeting.evening'
  | 'greeting.night'
  | 'dashboard.quickActions'
  | 'dashboard.reportIssue'
  | 'dashboard.building'
  | 'dashboard.filterAll'
  | 'dashboard.entryCode'
  | 'dashboard.memberCount'
  | 'dashboard.contacts'
  | 'contactType.whatsapp'
  | 'contactType.phone'
  | 'contactType.email'
  | 'myUnit.title'
  | 'myUnit.titleOne'
  | 'myUnit.center'
  | 'myUnit.centerSoon'
  | 'myUnit.empty'
  | 'myUnit.apartment'
  | 'myUnit.floor'
  | 'myUnit.relation'
  | 'myUnit.sqrm'
  | 'myUnit.paymentMethod'
  | 'myUnit.monthlyPayment'
  | 'relationType.owner'
  | 'relationType.tenant'
  | 'paymentMethod.cash'
  | 'paymentMethod.transfer'
  | 'paymentMethod.bit_paybox'
  | 'paymentMethod.card'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.email'
  | 'settings.emailVerified'
  | 'settings.verified'
  | 'settings.notVerified'
  | 'settings.userId'
  | 'settings.backToHome'
  | 'settings.nameLabel'
  | 'settings.languageLabel'
  | 'settings.dangerZoneTitle'
  | 'settings.dangerZoneDescription'
  | 'settings.deleteAccountButton'
  | 'settings.deleteDialogTitle'
  | 'settings.deleteDialogDescription'
  | 'settings.deleteConfirmInstruction'
  | 'settings.deleteConfirmPlaceholder'
  | 'settings.leaveBuildingTitle'
  | 'settings.leaveBuildingDescription'
  | 'settings.leaveBuildingButton'
  | 'settings.leaveDialogTitle'
  | 'settings.leaveDialogDescription'
  | 'settings.leaveConfirmInstruction'
  | 'settings.leaveConfirmPlaceholder'
  | 'common.delete'
  | 'admin.sectionTitle'
  | 'admin.sectionDescription'
  | 'admin.openPanel'
  | 'admin.subtitle'
  | 'admin.newBuilding'
  | 'admin.stats'
  | 'admin.noBuildings'
  | 'admin.editBuilding'
  | 'admin.join'
  | 'admin.joinAs'
  | 'admin.joined'
  | 'admin.joinHint'
  | 'admin.openBuilding'
  | 'admin.openJoinFirst'
  | 'admin.tabApartments'
  | 'admin.apartmentsEmpty'
  | 'admin.deleteTitle'
  | 'admin.deleteBody'
  | 'admin.deleteConfirmInstruction'
  | 'admin.saveError'
  | 'admin.duplicateError'
  | 'admin.identityAdminOnly'
  | 'admin.fieldName'
  | 'admin.fieldCity'
  | 'admin.fieldAddress'
  | 'admin.fieldDescription'
  | 'wizard.name.title'
  | 'wizard.name.subtitle'
  | 'wizard.name.placeholder'
  | 'wizard.city.title'
  | 'wizard.city.subtitle'
  | 'wizard.city.placeholder'
  | 'wizard.address.title'
  | 'wizard.address.subtitle'
  | 'wizard.address.placeholder'
  | 'wizard.details.title'
  | 'wizard.details.subtitle'
  | 'wizard.review.title'
  | 'wizard.review.subtitle'
  | 'wizard.review.create'
  | 'wizard.done'
  | 'role.committee_head'
  | 'role.resident'
  | 'members.title'
  | 'members.residents'
  | 'members.count'
  | 'members.unnamed'
  | 'members.apartment'
  | 'members.floor'
  | 'members.viewAll'
  | 'members.you'
  | 'members.remove'
  | 'members.removeConfirm'
  | 'members.roleLabel'
  | 'members.empty'
  | 'members.actionError'
  | 'docs.title'
  | 'docs.upload'
  | 'docs.uploadTitle'
  | 'docs.chooseFile'
  | 'docs.fileHint'
  | 'docs.titleLabel'
  | 'docs.empty'
  | 'docs.uploadError'
  | 'docs.tooLarge'
  | 'docs.badType'
  | 'docs.renameTitle'
  | 'docs.deleteTitle'
  | 'docs.deleteBody'
  | 'docs.actionError'
  | 'docs.downloadError'
  | 'dashboard.uploadDocument'
  | 'dashboard.viewMembers'
  | 'dashboard.noContacts'
  | 'admin.contactsTitle'
  | 'admin.addContact'
  | 'admin.contactLinkLabel'
  | 'admin.contactError'
  | 'wizard.contacts.title'
  | 'wizard.contacts.subtitle'
  | 'settings.profileTitle'
  | 'settings.editProfile'
  | 'settings.preferencesTitle'
  | 'settings.preferencesSubtitle'
  | 'settings.themeLabel'
  | 'settings.accountTitle'
  | 'theme.light'
  | 'theme.dark'
  | 'theme.system'
  | 'userMenu.profile'
  | 'userMenu.preferences'
  | 'adminFab.viewAs'
  | 'adminFab.viewAsHint'
  | 'adminFab.roleAdmin'
  | 'dashboard.viewingAs'
  | 'dashboard.switchBackToAdmin'
  | 'docs.noPreview'
  | 'docs.download'
  | 'docs.fullscreen'
  | 'docs.exitFullscreen'
  | 'docs.close'
  | 'adminFab.tooltip'
  | 'adminFab.openConsole'
  | 'admin.consoleTitle'
  | 'admin.searchBuildings'
  | 'admin.selectBuilding'
  | 'admin.noMatches'
  | 'admin.backToApp'
  | 'admin.tabOverview'
  | 'admin.tabMembers'
  | 'admin.tabDocuments'
  | 'role.management_company'
  | 'members.management'
  | 'common.formerResident'
  | 'dashboard.editDetails'
  | 'layout.sectionTitle'
  | 'layout.editToggle'
  | 'layout.editToggleHint'
  | 'layout.reset'
  | 'layout.resetDone'
  | 'layout.done'
  | 'layout.editingHint'
  | 'layout.dragHandle'
  | 'footer.feedback'
  | 'footer.privacy'
  | 'footer.terms'
  | 'footer.copyright'
  | 'footer.comingSoon'
  | 'footer.back'
  | 'footer.infoTitle'
  | 'footer.infoBody'
  | 'feedback.title'
  | 'feedback.widgetTitle'
  | 'feedback.label'
  | 'feedback.hint'
  | 'feedback.send'
  | 'feedback.thanks'
  | 'widgets.add'
  | 'widgets.menuTitle'
  | 'widgets.empty'
  | 'widgets.remove'
  | 'widgets.allAdded'
  | 'widgets.wantMore'
  | 'widgets.tellUs'
  | 'widgets.emptyHome'
  | 'widgets.tile.building'
  | 'widgets.tile.apartments'
  | 'widgets.tile.members'
  | 'widgets.tile.issues'
  | 'widgets.tile.docs'
  | 'widgets.desc.building'
  | 'widgets.desc.apartments'
  | 'widgets.desc.members'
  | 'widgets.desc.issues'
  | 'widgets.desc.docs'
  | 'layout.resetConfirmTitle'
  | 'layout.resetConfirmText'
  | 'widgets.removeConfirmTitle'
  | 'widgets.removeConfirmText'
  | 'widgets.removeConfirmAction'
  | 'widgets.tile.payments'
  | 'widgets.desc.payments'
  | 'payments.budget'
  | 'payments.myPart'
  | 'payments.collected'
  | 'payments.complete'
  | 'payments.notOpened'
  | 'payments.notOpenedResident'
  | 'payments.openMonth'
  | 'payments.addNew'
  | 'payments.markAll'
  | 'payments.markPaid'
  | 'payments.paid'
  | 'payments.unpaid'
  | 'payments.fee'
  | 'payments.noFee'
  | 'payments.editFee'
  | 'payments.feeTitle'
  | 'payments.feeAmount'
  | 'payments.scopeOnce'
  | 'payments.scopePermanent'
  | 'payments.save'
  | 'payments.cancel'
  | 'payments.pay'
  | 'payments.demoNote'
  | 'payments.history'
  | 'payments.noHistory'
  | 'payments.noApartments'
  | 'payments.error'
  | 'payments.confirmTitle'
  | 'payments.confirmOne'
  | 'payments.confirmAll'
  | 'payments.noResidents'
  | 'payments.setupTitle'
  | 'payments.setupHint'
  | 'payments.saveSetup'
  | 'payments.settings'
  | 'payments.openMode'
  | 'payments.openManual'
  | 'payments.openAuto'
  | 'payments.openDay'
  | 'payments.defaultFee'
  | 'payments.defaultFeeHint'
  | 'payments.defaultMethod'
  | 'payments.settingsNextMonth'
  | 'payments.autoOpensOn'
  | 'payments.method'
  | 'payments.log'
  | 'payments.apartmentLog'
  | 'payments.logTitleApartment'
  | 'payments.logEmpty'
  | 'payments.filterAll'
  | 'payments.filterMonth'
  | 'payments.filterApartment'
  | 'payments.filterMethod'
  | 'payments.colMonth'
  | 'payments.colAmount'
  | 'payments.colStatus'
  | 'payments.colPaidOn'
  | 'payments.colPaidBy'
  | 'payments.colConfirmedBy'
  | 'payments.colHow'
  | 'payments.confirmation.single'
  | 'payments.confirmation.bulk'
  | 'payments.confirmation.self'
  | 'payments.confirmation.automatic'
  | 'payments.payer'
  | 'payments.payerYou'
  | 'payments.payerOther'
  | 'payments.whoPays'
  | 'payments.whoPaysHint'
  | 'payments.wizardTitle'
  | 'payments.wizardSubtitle'
  | 'widgets.dragHint'
  | 'docs.chooseFiles'
  | 'docs.addMore'
  | 'docs.uploadCount'
  | 'issues.undo'
  | 'issues.undoHint'
  | 'issues.draftRestored'
  | 'members.manage'
  | 'members.manageTitle'
  | 'members.apartmentsTitle'
  | 'members.addApartment'
  | 'members.block'
  | 'members.blockConfirm'
  | 'members.blockHint'
  | 'members.removeHint'
  | 'members.blockedTitle'
  | 'members.blockedBy'
  | 'members.unblock'
  | 'myUnit.setByManagement'
  | 'settings.phoneLabel'
  | 'settings.phoneHint'
  | 'settings.phoneInvalid'
  | 'settings.saveError'
  | 'settings.pictureTooLarge'
  | 'settings.pictureError'
  | 'settings.deleteKeepsContent'
  | 'picture.add'
  | 'picture.edit'
  | 'picture.upload'
  | 'picture.remove'
  | 'picture.cropTitle'
  | 'picture.cropHint'
  | 'picture.zoom'
  | 'picture.notImage'
  | 'picture.pendingUpload'
  | 'picture.pendingRemove'
  | 'userMenu.emailVerified'
  | 'common.skip'
  | 'themeStep.title'
  | 'themeStep.subtitle'
  | 'phoneStep.title'
  | 'phoneStep.subtitle'
  | 'pictureStep.title'
  | 'pictureStep.subtitle'
  | 'noBuilding.title'
  | 'noBuilding.explain'
  | 'noBuilding.idLabel'
  | 'noBuilding.copy'
  | 'noBuilding.copied'
  | 'noBuilding.refresh'
  | 'noBuilding.aboutTitle'
  | 'noBuilding.aboutBody'
  | 'noBuilding.createTitle'
  | 'noBuilding.createHint'
  | 'noBuilding.create'
  | 'dashboard.createBuilding'
  | 'settings.userIdHint'
  | 'wizard.role.title'
  | 'wizard.role.subtitle'
  | 'wizard.role.label'
  | 'wizard.residents.title'
  | 'wizard.residents.subtitle'
  | 'wizard.duplicateError'
  | 'residents.addButton'
  | 'residents.addTitle'
  | 'residents.addHint'
  | 'residents.pasteLabel'
  | 'residents.pasteHint'
  | 'residents.addToList'
  | 'residents.lookingUp'
  | 'residents.noneFound'
  | 'residents.notFound'
  | 'residents.lookupError'
  | 'residents.empty'
  | 'residents.setForAll'
  | 'residents.setForAllHint'
  | 'residents.applyAll'
  | 'residents.relation'
  | 'residents.toAdd'
  | 'residents.removeRow'
  | 'residents.alreadyMember'
  | 'residents.blocked'
  | 'residents.isMe'
  | 'residents.needApartments'
  | 'residents.add'
  | 'residents.addError'
  | 'issues.title'
  | 'issues.new'
  | 'issues.empty'
  | 'issues.emptyFiltered'
  | 'issues.titleLabel'
  | 'issues.descriptionLabel'
  | 'issues.attach'
  | 'issues.attachHint'
  | 'issues.tooMany'
  | 'issues.post'
  | 'issues.postError'
  | 'issues.editTitle'
  | 'issues.deleteTitle'
  | 'issues.deleteBody'
  | 'issues.actionError'
  | 'issues.status.opened'
  | 'issues.status.in_process'
  | 'issues.status.denied'
  | 'issues.status.resolved'
  | 'issues.pinged'
  | 'issues.ping'
  | 'issues.pingHint'
  | 'issues.pingAvailable'
  | 'issues.pingWait'
  | 'issues.reportedBy'
  | 'issues.history'
  | 'issues.noteLabel'
  | 'issues.noteHint'
  | 'admin.tabIssues'
  | 'issues.action.in_process'
  | 'issues.action.denied'
  | 'issues.action.resolved'
  | 'issues.addUpdate'
  | 'issues.updateLabel'
  | 'issues.updateHint'
  | 'issues.send'
  | 'issues.closed'
  | 'issues.updateChip'
  | 'userMenu.signOut';

type Dict = Record<TranslationKey, string>;

// English and Hebrew are complete. The other languages may lack newer strings — the app shows the
// English text for any key missing there (see LanguageContext).
export const TRANSLATIONS: Record<'en' | 'he', Dict> & Record<Exclude<LanguageCode, 'en' | 'he'>, Partial<Dict>> = {
  en: {
    'common.continue': 'Continue',
    'common.finish': 'Finish',
    'common.getStarted': 'Get Started',
    'common.welcomeToBuildy': 'Welcome to buildy',
    'common.edit': 'Edit',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'language.title': 'Choose your language',
    'language.subtitle': 'You can change this later in settings.',
    'language.confirm': 'Language saved',
    'name.title': 'What should we call you?',
    'name.subtitle': "This is how you'll appear to your neighbors.",
    'name.placeholder': 'Your full name',
    'name.confirm': 'Nice to meet you, {{name}}',
    'home.title': 'buildy',
    'home.tagline': 'Everything about your building, in one place',
    'home.signInPrompt': 'Sign in to view building documents, finances, and notices',
    'home.signInButton': 'Sign In with Google',
    'dashboard.welcome': 'Welcome back, {{name}}',
    'summary.open': '{{count}} open',
    'summary.nothingOpen': 'Nothing open',
    'summary.seeAll': 'See all',
    'summary.ofGoal': 'of ₪{{goal}} · {{month}}',
    'summary.notOpened': 'This month is not open yet',
    'summary.yourPart': 'Your part · {{month}}',
    'summary.allPaid': 'All paid up',
    'summary.details': 'Details',
    'summary.people': '{{count}} people',
    'summary.managedBy': 'Managed by {{name}}',
    'nav.home': 'Home',
    'nav.issues': 'Issues',
    'nav.money': 'Money',
    'nav.docs': 'Documents',
    'nav.people': 'People',
    'nav.label': 'Sections',
    'language.partial': 'partial translation',
    'layout.presetsTitle': 'Start from a layout',
    'layout.preset.head': 'Committee head',
    'layout.preset.resident': 'Resident',
    'layout.preset.essentials': 'Just the essentials',
    'layout.preset.everything': 'Everything',
    'layout.presetDesc.head': 'Money and issues first',
    'layout.presetDesc.resident': 'Your part, the door code and what is being fixed',
    'layout.presetDesc.essentials': 'Two tiles, nothing else',
    'layout.presetDesc.everything': 'Every tile, in the usual layout',
    'layout.presetConfirmTitle': 'Use the “{{name}}” layout?',
    'layout.presetConfirmText': 'Your current arrangement on this device is replaced. You can still move and resize tiles afterwards.',
    'layout.presetApply': 'Use this layout',
    'payments.slideToPay': 'Slide to pay ₪{{amount}}',
    'payments.sending': 'Sending…',
    'payments.paidThanks': 'Paid, thank you',
    'door.hold': 'Hold to show',
    'door.tapToCopy': 'Tap the code to copy',
    'door.copied': 'Copied',
    'greeting.morning': 'Good morning, {{name}}',
    'greeting.afternoon': 'Good afternoon, {{name}}',
    'greeting.evening': 'Good evening, {{name}}',
    'greeting.night': 'Good night, {{name}}',
    'dashboard.quickActions': 'Quick actions',
    'dashboard.reportIssue': 'Report an issue',
    'dashboard.building': 'Building',
    'dashboard.filterAll': 'All',
    'dashboard.entryCode': 'Door code',
    'dashboard.memberCount': '{{count}} residents on buildy',
    'dashboard.contacts': 'Contact the building',
    'contactType.whatsapp': 'WhatsApp group',
    'contactType.phone': 'Phone',
    'contactType.email': 'Email',
    'myUnit.title': 'My apartments',
    'myUnit.titleOne': 'My apartment',
    'myUnit.center': 'Apartment center',
    'myUnit.centerSoon': 'Everything about this apartment will live here soon.',
    'myUnit.empty': "Building management hasn't linked an apartment to you yet.",
    'myUnit.apartment': 'Apartment',
    'myUnit.floor': 'Floor',
    'myUnit.relation': 'I am',
    'myUnit.sqrm': 'Size (m²)',
    'myUnit.paymentMethod': 'Pays by',
    'myUnit.monthlyPayment': 'Monthly fee',
    'relationType.owner': 'Owner',
    'relationType.tenant': 'Tenant',
    'paymentMethod.card': 'Credit card',
    'paymentMethod.cash': 'Cash',
    'paymentMethod.transfer': 'Bank transfer',
    'paymentMethod.bit_paybox': 'Bit / PayBox',
    'settings.title': 'Account Settings',
    'settings.subtitle': 'Manage your profile and account',
    'settings.email': 'Email',
    'settings.emailVerified': 'Email Verified',
    'settings.verified': 'Verified',
    'settings.notVerified': 'Not Verified',
    'settings.userId': 'Your ID',
    'settings.backToHome': 'Back to Home',
    'settings.nameLabel': 'Name',
    'settings.languageLabel': 'Language',
    'settings.dangerZoneTitle': 'Danger zone',
    'settings.dangerZoneDescription':
      'Deleting your account permanently removes your profile and data. This cannot be undone.',
    'settings.deleteAccountButton': 'Delete account',
    'settings.deleteDialogTitle': 'Delete your account?',
    'settings.deleteDialogDescription':
      'This will permanently delete your buildy profile and remove your access. This action cannot be undone.',
    'settings.deleteConfirmInstruction': 'Type "{{phrase}}" to confirm.',
    'settings.deleteConfirmPlaceholder': 'Type {{phrase}}',
    'settings.leaveBuildingTitle': 'Leave building',
    'settings.leaveBuildingDescription': "You'll be asked to join a building again the next time you sign in.",
    'settings.leaveBuildingButton': 'Leave building',
    'settings.leaveDialogTitle': 'Leave this building?',
    'settings.leaveDialogDescription':
      "You'll lose access to this building's issues and information until you join again.",
    'settings.leaveConfirmInstruction': 'Type "{{phrase}}" to confirm.',
    'settings.leaveConfirmPlaceholder': 'Type {{phrase}}',
    'common.delete': 'Delete',
    'admin.sectionTitle': 'Admin',
    'admin.sectionDescription': 'Create, edit and delete buildings and their messages.',
    'admin.openPanel': 'Open admin panel',
    'admin.subtitle': 'Everything you can manage as a buildy admin.',
    'admin.newBuilding': 'New building',
    'admin.stats': '{{members}} residents · {{messages}} messages · {{docs}} docs',
    'admin.noBuildings': 'No buildings yet.',
    'admin.editBuilding': 'Edit building',
    'admin.join': 'Join building',
    'admin.joinAs': 'Join as {{role}}',
    'admin.joined': "You're a member here",
    'admin.joinHint': 'It will show in your building switcher. Your admin powers stay the same.',
    'admin.openBuilding': 'Open building',
    'admin.openJoinFirst': "You're not a member yet. Join with a role to open it in the app:",
    'admin.tabApartments': 'Apartments',
    'admin.apartmentsEmpty': 'No apartments in this building yet.',
    'admin.deleteTitle': 'Delete {{name}}?',
    'admin.deleteBody': "This permanently deletes the building together with its residents' memberships, messages and documents.",
    'admin.deleteConfirmInstruction': 'Type the building name to confirm.',
    'admin.saveError': "Couldn't save the building. Please try again.",
    'admin.duplicateError': 'A building with this address already exists in this city.',
    'admin.identityAdminOnly': 'Only an admin can change the name, city and address',
    'admin.fieldName': 'Name',
    'admin.fieldCity': 'City',
    'admin.fieldAddress': 'Address',
    'admin.fieldDescription': 'Description',
    'wizard.name.title': 'What is the building called?',
    'wizard.name.subtitle': 'Residents will see this name on their home screen.',
    'wizard.name.placeholder': 'e.g. Maple Court',
    'wizard.city.title': 'Which city is it in?',
    'wizard.city.subtitle': 'Start typing to search the official list of cities and settlements.',
    'wizard.city.placeholder': 'Search city',
    'wizard.address.title': "What's the street address?",
    'wizard.address.subtitle': 'Street and number.',
    'wizard.address.placeholder': 'e.g. 14 Ben Yehuda St',
    'wizard.details.title': 'A few details',
    'wizard.details.subtitle': 'Optional — you can fill these in later.',
    'wizard.review.title': 'Ready to create?',
    'wizard.review.subtitle': 'Check the details below.',
    'wizard.review.create': 'Create building',
    'wizard.done': 'Building created',
    'role.committee_head': 'Committee head',
    'role.resident': 'Resident',
    'members.title': 'Members',
    'members.residents': 'Residents',
    'members.count': '{{count}} members',
    'members.unnamed': 'Unnamed resident',
    'members.apartment': 'Apt {{apartment}}',
    'members.floor': 'Floor {{floor}}',
    'members.viewAll': 'View all',
    'members.you': 'You',
    'members.remove': 'Remove from building',
    'members.removeConfirm': 'Remove {{name}} from the building?',
    'members.roleLabel': 'Role',
    'members.empty': 'No members yet.',
    'members.actionError': "Couldn't update the member. Please try again.",
    'docs.title': 'Documents',
    'docs.upload': 'Upload',
    'docs.uploadTitle': 'Upload a document',
    'docs.chooseFile': 'Choose file',
    'docs.fileHint': 'PDF, Word, Excel, PowerPoint, images or text · up to 10 MB',
    'docs.titleLabel': 'Title (optional)',
    'docs.empty': 'No documents yet.',
    'docs.uploadError': "Couldn't upload the file. Please try again.",
    'docs.tooLarge': 'The file is larger than 10 MB.',
    'docs.badType': "This file type isn't supported.",
    'docs.renameTitle': 'Rename document',
    'docs.deleteTitle': 'Delete this document?',
    'docs.deleteBody': 'It will be removed for everyone in the building.',
    'docs.actionError': "Couldn't update the document. Please try again.",
    'docs.downloadError': "Couldn't open the file.",
    'dashboard.uploadDocument': 'Upload a document',
    'dashboard.viewMembers': 'Building members',
    'dashboard.noContacts': 'No contact links yet.',
    'admin.contactsTitle': 'Contact links',
    'admin.addContact': 'Add',
    'admin.contactLinkLabel': 'Link, number or email',
    'admin.contactError': 'Check the link: WhatsApp needs an https:// link, phone a number, email an address.',
    'wizard.contacts.title': 'How can residents reach the committee?',
    'wizard.contacts.subtitle': 'Add a WhatsApp group, phone or email. You can add more later.',
    'settings.profileTitle': 'Profile',
    'settings.editProfile': 'Edit profile',
    'settings.preferencesTitle': 'App preferences',
    'settings.preferencesSubtitle': 'Saved on this device.',
    'settings.themeLabel': 'Appearance',
    'settings.accountTitle': 'Account',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'userMenu.profile': 'Edit profile',
    'userMenu.preferences': 'App preferences',
    'adminFab.viewAs': 'View as',
    'adminFab.viewAsHint': 'Preview buildy as one of these roles',
    'adminFab.roleAdmin': 'Admin (full access)',
    'dashboard.viewingAs': "You're viewing buildy as {{role}} — admin tools are hidden.",
    'dashboard.switchBackToAdmin': 'Switch back to admin',
    'docs.noPreview': 'No preview for this file type — download it to open.',
    'docs.download': 'Download',
    'docs.fullscreen': 'Full screen',
    'docs.exitFullscreen': 'Exit full screen',
    'docs.close': 'Close',
    'adminFab.tooltip': 'Admin tools',
    'adminFab.openConsole': 'Open admin console',
    'admin.consoleTitle': 'Admin console',
    'admin.searchBuildings': 'Search buildings',
    'admin.selectBuilding': 'Building',
    'admin.noMatches': 'No buildings match.',
    'admin.backToApp': 'Back to the app',
    'admin.tabOverview': 'Overview',
    'admin.tabMembers': 'Members',
    'admin.tabDocuments': 'Documents',
    'role.management_company': 'Management company',
    'members.management': 'Building management',
    'common.formerResident': 'Former resident',
    'dashboard.editDetails': 'Edit details',
    'layout.sectionTitle': 'Home layout',
    'layout.editToggle': 'Edit home layout',
    'layout.editToggleHint': 'When on, hover a tile on the home screen to drag or resize it.',
    'layout.reset': 'Reset layout',
    'layout.resetDone': 'Layout reset',
    'layout.resetConfirmTitle': 'Reset the layout?',
    'layout.resetConfirmText': 'Every widget goes back to its default place and size, and removed widgets come back.',
    'widgets.removeConfirmTitle': 'Remove {{name}}?',
    'widgets.removeConfirmText': 'You can add it back any time from Add widgets.',
    'widgets.removeConfirmAction': 'Remove',
    'layout.done': 'Done',
    'layout.editingHint': 'Editing your layout — drag a tile by its handle, resize it from the corner.',
    'layout.dragHandle': 'Drag to move',
    'footer.feedback': 'Feedback',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.copyright': '© {{year}} Buildy',
    'footer.comingSoon': 'This page is coming soon.',
    'footer.back': 'Back',
    'footer.infoTitle': 'About Buildy',
    'footer.infoBody': 'Buildy helps residents and building management run their building together. More about the app is coming soon.',
    'feedback.title': 'Send feedback',
    'feedback.widgetTitle': 'Want to see more widgets?',
    'feedback.label': 'Share your idea',
    'feedback.hint': 'Tell us what is missing or what we could do better.',
    'feedback.send': 'Send',
    'feedback.thanks': 'Thank you! We read every message.',
    'widgets.add': 'Add widgets',
    'widgets.menuTitle': 'Widgets',
    'docs.chooseFiles': 'Choose files (or drop them here)',
    'docs.addMore': 'Add more files',
    'docs.uploadCount': 'Upload {{count}} files',
    'widgets.dragHint': 'Drag a widget onto your home page, or click it to add.',
    'widgets.desc.building': 'Address, door code and contact links.',
    'widgets.desc.apartments': 'Your apartment, or all of them across your buildings.',
    'widgets.desc.members': 'Neighbours and building management.',
    'widgets.desc.issues': 'Report and follow problems in the building.',
    'widgets.desc.docs': 'Shared files and documents.',
    'widgets.empty': 'Your home page is empty. Add a widget to get started.',
    'widgets.remove': 'Remove widget',
    'widgets.allAdded': 'All widgets are already on your home page.',
    'widgets.wantMore': 'Want to see more widgets?',
    'widgets.tellUs': 'Tell us',
    'widgets.emptyHome': 'Nothing here yet.',
    'widgets.tile.building': 'Building',
    'widgets.tile.apartments': 'My apartment',
    'widgets.tile.members': 'Members',
    'widgets.tile.issues': 'Issues',
    'widgets.tile.docs': 'Documents',
    'widgets.tile.payments': 'Payments',
    'widgets.desc.payments': 'Monthly fees: the building budget and your own part.',
    'payments.budget': 'Monthly budget',
    'payments.myPart': 'My part',
    'payments.collected': '₪{{collected}} of ₪{{goal}} collected',
    'payments.complete': 'Fully collected',
    'payments.notOpened': "This month isn't open yet. Opening it creates a charge for every apartment from its monthly fee.",
    'payments.notOpenedResident': "Building management hasn't opened this month yet.",
    'payments.openMonth': 'Open this month',
    'payments.addNew': 'Add {{count}} new apartments',
    'payments.markAll': 'Mark all as paid',
    'payments.markPaid': 'Mark paid',
    'payments.paid': 'Paid',
    'payments.unpaid': 'Unpaid',
    'payments.fee': '₪{{amount}}',
    'payments.noFee': 'No fee set',
    'payments.editFee': 'Change fee',
    'payments.feeTitle': 'Fee for apartment {{apartment}}',
    'payments.feeAmount': 'Monthly fee (₪)',
    'payments.scopeOnce': 'This month only',
    'payments.scopePermanent': 'From now on',
    'payments.save': 'Save',
    'payments.cancel': 'Cancel',
    'payments.pay': 'Pay',
    'payments.demoNote': 'Demo: paying here only marks the month as paid. No real money moves.',
    'payments.history': 'Previous months',
    'payments.noHistory': 'No previous months yet.',
    'payments.noApartments': 'You have no apartments in this building.',
    'payments.error': 'Something went wrong. Try again.',
    'payments.confirmTitle': 'Mark as paid?',
    'payments.confirmOne': 'Apartment {{apartment}} will be marked as paid for this month. This can\'t be undone.',
    'payments.confirmAll': 'Every unpaid apartment will be marked as paid for this month. This can\'t be undone.',
    'payments.noResidents': 'No residents',
    'payments.setupTitle': 'Set up payments',
    'payments.setupHint': 'Choose how each month opens, the default fee and how apartments usually pay. You can change this later.',
    'payments.saveSetup': 'Save',
    'payments.settings': 'Payment settings',
    'payments.openMode': 'Opening each month',
    'payments.openManual': 'By hand: I press "Open this month"',
    'payments.openAuto': 'Automatically, on a day of the month',
    'payments.openDay': 'Opening day (1–28)',
    'payments.defaultFee': 'Default monthly fee (₪)',
    'payments.defaultFeeHint': 'For every apartment without a fee of its own.',
    'payments.defaultMethod': 'Default payment method',
    'payments.settingsNextMonth': 'Changes apply from the next month.',
    'payments.autoOpensOn': 'Opens by itself on day {{day}} of the month.',
    'payments.method': 'Payment method',
    'payments.log': 'Payments log',
    'payments.apartmentLog': 'Payment log',
    'payments.logTitleApartment': 'Payment log · apartment {{apartment}}',
    'payments.logEmpty': 'No payments yet.',
    'payments.filterAll': 'All',
    'payments.filterMonth': 'Month',
    'payments.filterApartment': 'Apartment',
    'payments.filterMethod': 'Method',
    'payments.colMonth': 'For',
    'payments.colAmount': 'Amount',
    'payments.colStatus': 'Status',
    'payments.colPaidOn': 'Paid on',
    'payments.colPaidBy': 'Paid by',
    'payments.colConfirmedBy': 'Confirmed by',
    'payments.colHow': 'How',
    'payments.confirmation.single': 'Marked by management',
    'payments.confirmation.bulk': 'Mark all (management)',
    'payments.confirmation.self': 'Paid by the resident',
    'payments.confirmation.automatic': 'Automatic',
    'payments.payer': 'Pays: {{name}}',
    'payments.payerYou': 'You pay this apartment.',
    'payments.payerOther': '{{name}} pays this apartment.',
    'payments.whoPays': 'Who pays',
    'payments.whoPaysHint': 'As an owner, you choose who pays the monthly fee.',
    'payments.wizardTitle': 'Payments',
    'payments.wizardSubtitle': 'How each month opens, the default fee and how apartments usually pay. You can change this later.',
    'issues.undo': 'Undo',
    'issues.undoHint': 'You can take this back and edit it until the timer runs out.',
    'issues.draftRestored': 'Your previous message is back, so you can edit it and send it again.',
    'members.manage': 'Manage',
    'members.manageTitle': 'Manage {{name}}',
    'members.apartmentsTitle': 'Apartments',
    'members.addApartment': 'Add apartment',
    'members.block': 'Block',
    'members.blockConfirm': 'Block {{name}}?',
    'members.blockHint': "They'll be removed and can't rejoin until unblocked.",
    'members.removeHint': 'Building management can add them again.',
    'members.blockedTitle': 'Blocked',
    'members.blockedBy': 'Blocked by {{name}}',
    'members.unblock': 'Unblock',
    'myUnit.setByManagement': 'Apartments and payment details are set by building management.',
    'settings.phoneLabel': 'Phone',
    'settings.phoneHint': 'Optional. Only building management and admins can see it.',
    'settings.phoneInvalid': 'That phone number looks wrong.',
    'settings.saveError': "Couldn't save. Please try again.",
    'settings.pictureTooLarge': 'The picture is larger than 2 MB.',
    'settings.pictureError': "Couldn't update your picture. Please try again.",
    'settings.deleteKeepsContent': "Messages and documents you posted stay in the building, shown as 'Former resident'.",
    'picture.add': 'Add profile picture',
    'picture.edit': 'Edit profile picture',
    'picture.upload': 'Upload file',
    'picture.remove': 'Remove picture',
    'picture.cropTitle': 'Adjust your picture',
    'picture.cropHint': 'Drag to move, use the slider to zoom. The circle is what others will see.',
    'picture.zoom': 'Zoom',
    'picture.notImage': 'Please choose an image file.',
    'picture.pendingUpload': 'New picture ready — press Save to keep it.',
    'picture.pendingRemove': 'Picture will be removed when you press Save.',
    'userMenu.emailVerified': 'Email verified',
    'userMenu.signOut': 'Sign Out',
    'common.skip': 'Skip',
    'themeStep.title': 'Pick your look',
    'themeStep.subtitle': 'Light, dark, or follow your device. You can change it any time in Settings.',
    'phoneStep.title': 'Your phone number',
    'phoneStep.subtitle': 'Optional. Only building management can see it.',
    'pictureStep.title': 'Add a picture',
    'pictureStep.subtitle': 'Optional. Without one, we use your Google photo or your initials.',
    'noBuilding.title': 'Welcome, {{name}}',
    'noBuilding.explain': "You're not in a building yet. Send your ID to your committee head or management company — once they add you, your building appears here.",
    'noBuilding.idLabel': 'Your ID',
    'noBuilding.copy': 'Copy',
    'noBuilding.copied': 'Copied',
    'noBuilding.refresh': 'Check again',
    'noBuilding.aboutTitle': 'What is buildy?',
    'noBuilding.aboutBody': 'buildy keeps everything about your building in one place: neighbours, documents, contacts and issues.',
    'noBuilding.createTitle': 'Managing a building?',
    'noBuilding.createHint': 'Committee heads and management companies can set up their building and add their residents.',
    'noBuilding.create': 'Create a building',
    'dashboard.createBuilding': 'Create a building',
    'settings.userIdHint': 'Share it with your committee head so they can add you to a building.',
    'wizard.role.title': 'What is your role?',
    'wizard.role.subtitle': "You'll manage this building and decide who joins it.",
    'wizard.role.label': 'Your role',
    'wizard.residents.title': 'Add your residents',
    'wizard.residents.subtitle': 'Optional. Paste the IDs your residents sent you — you can also do this later from the members list.',
    'wizard.duplicateError': "A building with this address already exists in this city. If it's yours, please contact support.",
    'residents.addButton': 'Add residents',
    'residents.addTitle': 'Add residents',
    'residents.addHint': "Paste everyone's IDs at once, then set their apartments below. They're added straight away.",
    'residents.pasteLabel': 'User IDs',
    'residents.pasteHint': "Paste the whole text you received — we'll pick out the IDs.",
    'residents.addToList': 'Add to list',
    'residents.lookingUp': 'Looking up…',
    'residents.noneFound': 'No user IDs found in that text.',
    'residents.notFound': '{{count}} ID(s) not found: {{ids}}',
    'residents.lookupError': "Couldn't look those up. Please try again.",
    'residents.empty': 'No one on the list yet.',
    'residents.setForAll': 'Set for everyone',
    'residents.setForAllHint': 'Fill in only what you want to set — empty fields are left alone.',
    'residents.applyAll': 'Apply to all',
    'residents.relation': 'Owner / renter',
    'residents.toAdd': '{{count}} to add',
    'residents.removeRow': 'Remove from list',
    'residents.alreadyMember': 'Already in this building',
    'residents.blocked': 'Blocked — unblock first',
    'residents.isMe': "That's you",
    'residents.needApartments': 'Every person needs an apartment number.',
    'residents.add': 'Add {{count}}',
    'residents.addError': "Couldn't add them. Please try again.",
    'issues.title': 'Issues',
    'issues.new': 'Report an issue',
    'issues.empty': 'No issues reported yet.',
    'issues.emptyFiltered': 'No issues with this status.',
    'issues.titleLabel': 'What is the problem?',
    'issues.descriptionLabel': 'Details (optional)',
    'issues.attach': 'Add pictures or files',
    'issues.attachHint': 'Up to 10 files, 10 MB each.',
    'issues.tooMany': 'Up to 10 files.',
    'issues.post': 'Report',
    'issues.postError': "Couldn't report the issue. Please try again.",
    'issues.editTitle': 'Edit issue',
    'issues.deleteTitle': 'Delete this issue?',
    'issues.deleteBody': 'It and its files will be removed for everyone in the building.',
    'issues.actionError': 'Something went wrong. Please try again.',
    'issues.status.opened': 'Opened',
    'issues.status.in_process': 'In process',
    'issues.status.denied': 'Denied',
    'issues.status.resolved': 'Resolved',
    'issues.pinged': 'Pinged',
    'issues.ping': 'Ping',
    'issues.pingHint': 'Brings this issue back to the top. Once a week.',
    'issues.pingAvailable': 'You can ping again on {{date}}.',
    'issues.pingWait': 'You can ping an issue once a week.',
    'issues.reportedBy': 'Reported by {{name}} on {{date}}',
    'issues.history': 'History',
    'issues.noteLabel': 'Note (required)',
    'issues.noteHint': 'Explain the decision or what happens next. You can also attach pictures or files.',
    'admin.tabIssues': 'Issues',
    'issues.action.in_process': 'Accept issue',
    'issues.action.denied': 'Deny',
    'issues.action.resolved': 'Mark as resolved',
    'issues.addUpdate': 'Add an update',
    'issues.updateLabel': 'Message',
    'issues.updateHint': 'Add a message, pictures or files — at least one.',
    'issues.send': 'Send',
    'issues.closed': 'This issue is closed — nothing can be changed any more.',
    'issues.updateChip': 'Update',
  },
  he: {
    'common.continue': 'המשך',
    'common.finish': 'סיום',
    'common.getStarted': 'בואו נתחיל',
    'common.welcomeToBuildy': 'ברוכים הבאים ל-buildy',
    'common.edit': 'עריכה',
    'common.save': 'שמירה',
    'common.cancel': 'ביטול',
    'language.title': 'בחרו שפה',
    'language.subtitle': 'תוכלו לשנות זאת מאוחר יותר בהגדרות.',
    'language.confirm': 'השפה נשמרה',
    'name.title': 'איך נקרא לכם?',
    'name.subtitle': 'כך תופיעו בפני שכניכם.',
    'name.placeholder': 'השם המלא שלכם',
    'name.confirm': 'נעים להכיר, {{name}}',
    'home.title': 'buildy',
    'home.tagline': 'כל מה שקשור לבניין שלכם, במקום אחד',
    'home.signInPrompt': 'התחברו כדי לצפות במסמכי הבניין, בכספים ובהודעות',
    'home.signInButton': 'התחברות עם Google',
    'dashboard.welcome': 'שלום, {{name}}',
    'summary.open': '{{count}} פתוחות',
    'summary.nothingOpen': 'אין תקלות פתוחות',
    'summary.seeAll': 'הכל',
    'summary.ofGoal': 'מתוך ₪{{goal}} · {{month}}',
    'summary.notOpened': 'החודש עוד לא נפתח',
    'summary.yourPart': 'החלק שלך · {{month}}',
    'summary.allPaid': 'הכל שולם',
    'summary.details': 'פרטים',
    'summary.people': '{{count}} אנשים',
    'summary.managedBy': 'בניהול {{name}}',
    'nav.home': 'בית',
    'nav.issues': 'תקלות',
    'nav.money': 'כספים',
    'nav.docs': 'מסמכים',
    'nav.people': 'דיירים',
    'nav.label': 'אזורים',
    'language.partial': 'תרגום חלקי',
    'layout.presetsTitle': 'התחילו מפריסה מוכנה',
    'layout.preset.head': 'ועד הבית',
    'layout.preset.resident': 'דייר',
    'layout.preset.essentials': 'רק העיקר',
    'layout.preset.everything': 'הכול',
    'layout.presetDesc.head': 'כסף ותקלות קודם',
    'layout.presetDesc.resident': 'החלק שלך, קוד הכניסה ומה מתוקן',
    'layout.presetDesc.essentials': 'שני אריחים, בלי עומס',
    'layout.presetDesc.everything': 'כל האריחים, בפריסה הרגילה',
    'layout.presetConfirmTitle': 'להשתמש בפריסה „{{name}}”?',
    'layout.presetConfirmText': 'הסידור הנוכחי במכשיר הזה יוחלף. אפשר עדיין להזיז ולשנות גודל אחר כך.',
    'layout.presetApply': 'השתמשו בפריסה',
    'payments.slideToPay': 'החליקו לתשלום ₪{{amount}}',
    'payments.sending': 'שולח…',
    'payments.paidThanks': 'שולם, תודה',
    'door.hold': 'לחצו ממושך כדי להציג',
    'door.tapToCopy': 'הקישו על הקוד להעתקה',
    'door.copied': 'הועתק',
    'greeting.morning': 'בוקר טוב, {{name}}',
    'greeting.afternoon': 'צהריים טובים, {{name}}',
    'greeting.evening': 'ערב טוב, {{name}}',
    'greeting.night': 'לילה טוב, {{name}}',
    'dashboard.quickActions': 'פעולות מהירות',
    'dashboard.reportIssue': 'דיווח על תקלה',
    'dashboard.building': 'הבניין',
    'dashboard.filterAll': 'הכול',
    'dashboard.entryCode': 'קוד כניסה',
    'dashboard.memberCount': '{{count}} דיירים ב-buildy',
    'dashboard.contacts': 'יצירת קשר עם הבניין',
    'contactType.whatsapp': 'קבוצת וואטסאפ',
    'contactType.phone': 'טלפון',
    'contactType.email': 'אימייל',
    'myUnit.title': 'הדירות שלי',
    'myUnit.titleOne': 'הדירה שלי',
    'myUnit.center': 'מרכז הדירה',
    'myUnit.centerSoon': 'כל מה שקשור לדירה הזאת יהיה כאן בקרוב.',
    'myUnit.empty': 'הנהלת הבניין עדיין לא שייכה אליכם דירה.',
    'myUnit.apartment': 'דירה',
    'myUnit.floor': 'קומה',
    'myUnit.relation': 'אני',
    'myUnit.sqrm': 'גודל (מ"ר)',
    'myUnit.paymentMethod': 'אמצעי תשלום',
    'myUnit.monthlyPayment': 'דמי ועד חודשיים',
    'relationType.owner': 'בעל/ת דירה',
    'relationType.tenant': 'שוכר/ת',
    'paymentMethod.card': 'כרטיס אשראי',
    'paymentMethod.cash': 'מזומן',
    'paymentMethod.transfer': 'העברה בנקאית',
    'paymentMethod.bit_paybox': 'ביט / פייבוקס',
    'settings.title': 'הגדרות חשבון',
    'settings.subtitle': 'נהלו את הפרופיל והחשבון שלכם',
    'settings.email': 'אימייל',
    'settings.emailVerified': 'אימות אימייל',
    'settings.verified': 'מאומת',
    'settings.notVerified': 'לא מאומת',
    'settings.userId': 'המזהה שלכם',
    'settings.backToHome': 'חזרה לדף הבית',
    'settings.nameLabel': 'שם',
    'settings.languageLabel': 'שפה',
    'settings.dangerZoneTitle': 'אזור מסוכן',
    'settings.dangerZoneDescription': 'מחיקת החשבון תסיר לצמיתות את הפרופיל והנתונים שלכם. לא ניתן לבטל פעולה זו.',
    'settings.deleteAccountButton': 'מחיקת חשבון',
    'settings.deleteDialogTitle': 'למחוק את החשבון?',
    'settings.deleteDialogDescription':
      'פעולה זו תמחק לצמיתות את פרופיל buildy שלכם ותסיר את הגישה שלכם. לא ניתן לבטל פעולה זו.',
    'settings.deleteConfirmInstruction': 'הקלידו "{{phrase}}" כדי לאשר.',
    'settings.deleteConfirmPlaceholder': 'הקלידו {{phrase}}',
    'settings.leaveBuildingTitle': 'עזיבת הבניין',
    'settings.leaveBuildingDescription': 'תתבקשו להצטרף לבניין מחדש בפעם הבאה שתתחברו.',
    'settings.leaveBuildingButton': 'עזיבת הבניין',
    'settings.leaveDialogTitle': 'לעזוב את הבניין?',
    'settings.leaveDialogDescription': 'תאבדו את הגישה לתקלות ולמידע של הבניין הזה עד שתצטרפו מחדש.',
    'settings.leaveConfirmInstruction': 'הקלידו "{{phrase}}" כדי לאשר.',
    'settings.leaveConfirmPlaceholder': 'הקלידו {{phrase}}',
    'common.delete': 'מחיקה',
    'admin.sectionTitle': 'ניהול',
    'admin.sectionDescription': 'יצירה, עריכה ומחיקה של בניינים וההודעות שלהם.',
    'admin.openPanel': 'פתיחת לוח הניהול',
    'admin.subtitle': 'כל מה שאפשר לנהל כמנהל/ת buildy.',
    'admin.newBuilding': 'בניין חדש',
    'admin.stats': '{{members}} דיירים · {{messages}} הודעות · {{docs}} מסמכים',
    'admin.noBuildings': 'אין בניינים עדיין.',
    'admin.editBuilding': 'עריכת בניין',
    'admin.join': 'הצטרפות לבניין',
    'admin.joinAs': 'הצטרפות בתור {{role}}',
    'admin.joined': 'את/ה חבר/ה בבניין הזה',
    'admin.joinHint': 'הבניין יופיע בבורר הבניינים שלך. הרשאות המנהל שלך לא משתנות.',
    'admin.openBuilding': 'פתיחת הבניין',
    'admin.openJoinFirst': 'עדיין אין לך חברות בבניין. הצטרפות עם תפקיד כדי לפתוח אותו באפליקציה:',
    'admin.tabApartments': 'דירות',
    'admin.apartmentsEmpty': 'אין עדיין דירות בבניין הזה.',
    'admin.deleteTitle': 'למחוק את {{name}}?',
    'admin.deleteBody': 'פעולה זו מוחקת לצמיתות את הבניין יחד עם שיוך הדיירים, ההודעות והמסמכים שלו.',
    'admin.deleteConfirmInstruction': 'הקלידו את שם הבניין לאישור.',
    'admin.saveError': 'לא הצלחנו לשמור את הבניין. נסו שוב.',
    'admin.duplicateError': 'כבר קיים בניין בכתובת הזו בעיר הזו.',
    'admin.identityAdminOnly': 'רק מנהל מערכת יכול לשנות שם, עיר וכתובת',
    'admin.fieldName': 'שם',
    'admin.fieldCity': 'עיר',
    'admin.fieldAddress': 'כתובת',
    'admin.fieldDescription': 'תיאור',
    'wizard.name.title': 'איך נקרא הבניין?',
    'wizard.name.subtitle': 'הדיירים יראו את השם הזה במסך הבית.',
    'wizard.name.placeholder': 'למשל: בית האדר',
    'wizard.city.title': 'באיזו עיר הוא נמצא?',
    'wizard.city.subtitle': 'התחילו להקליד כדי לחפש ברשימה הרשמית של הערים והיישובים.',
    'wizard.city.placeholder': 'חיפוש עיר',
    'wizard.address.title': 'מה כתובת הרחוב?',
    'wizard.address.subtitle': 'רחוב ומספר.',
    'wizard.address.placeholder': 'למשל: בן יהודה 14',
    'wizard.details.title': 'כמה פרטים',
    'wizard.details.subtitle': 'לא חובה — אפשר להשלים מאוחר יותר.',
    'wizard.review.title': 'מוכנים ליצור?',
    'wizard.review.subtitle': 'בדקו את הפרטים למטה.',
    'wizard.review.create': 'יצירת בניין',
    'wizard.done': 'הבניין נוצר',
    'role.committee_head': 'יו"ר הוועד',
    'role.resident': 'דייר/ת',
    'members.title': 'דיירים',
    'members.residents': 'דיירים',
    'members.count': '{{count}} דיירים',
    'members.unnamed': 'דייר/ת ללא שם',
    'members.apartment': 'דירה {{apartment}}',
    'members.floor': 'קומה {{floor}}',
    'members.viewAll': 'הצגת הכול',
    'members.you': 'את/ה',
    'members.remove': 'הסרה מהבניין',
    'members.removeConfirm': 'להסיר את {{name}} מהבניין?',
    'members.roleLabel': 'תפקיד',
    'members.empty': 'אין דיירים עדיין.',
    'members.actionError': 'לא הצלחנו לעדכן את הדייר. נסו שוב.',
    'docs.title': 'מסמכים',
    'docs.upload': 'העלאה',
    'docs.uploadTitle': 'העלאת מסמך',
    'docs.chooseFile': 'בחירת קובץ',
    'docs.fileHint': 'PDF, Word, Excel, PowerPoint, תמונות או טקסט · עד 10MB',
    'docs.titleLabel': 'כותרת (לא חובה)',
    'docs.empty': 'אין מסמכים עדיין.',
    'docs.uploadError': 'לא הצלחנו להעלות את הקובץ. נסו שוב.',
    'docs.tooLarge': 'הקובץ גדול מ-10MB.',
    'docs.badType': 'סוג הקובץ הזה אינו נתמך.',
    'docs.renameTitle': 'שינוי שם המסמך',
    'docs.deleteTitle': 'למחוק את המסמך?',
    'docs.deleteBody': 'הוא יוסר עבור כל דיירי הבניין.',
    'docs.actionError': 'לא הצלחנו לעדכן את המסמך. נסו שוב.',
    'docs.downloadError': 'לא הצלחנו לפתוח את הקובץ.',
    'dashboard.uploadDocument': 'העלאת מסמך',
    'dashboard.viewMembers': 'דיירי הבניין',
    'dashboard.noContacts': 'אין קישורי קשר עדיין.',
    'admin.contactsTitle': 'קישורי קשר',
    'admin.addContact': 'הוספה',
    'admin.contactLinkLabel': 'קישור, מספר או אימייל',
    'admin.contactError': 'בדקו את הקישור: לוואטסאפ צריך קישור https://, לטלפון מספר, ולאימייל כתובת.',
    'wizard.contacts.title': 'איך הדיירים יכולים לפנות לוועד?',
    'wizard.contacts.subtitle': 'הוסיפו קבוצת וואטסאפ, טלפון או אימייל. אפשר להוסיף עוד מאוחר יותר.',
    'settings.profileTitle': 'פרופיל',
    'settings.editProfile': 'עריכת פרופיל',
    'settings.preferencesTitle': 'העדפות אפליקציה',
    'settings.preferencesSubtitle': 'נשמר במכשיר הזה.',
    'settings.themeLabel': 'מראה',
    'settings.accountTitle': 'חשבון',
    'theme.light': 'בהיר',
    'theme.dark': 'כהה',
    'theme.system': 'לפי המערכת',
    'userMenu.profile': 'עריכת פרופיל',
    'userMenu.preferences': 'העדפות אפליקציה',
    'adminFab.viewAs': 'תצוגה בתור',
    'adminFab.viewAsHint': 'לראות את buildy בתור אחד מהתפקידים',
    'adminFab.roleAdmin': 'מנהל מערכת (גישה מלאה)',
    'dashboard.viewingAs': 'את/ה צופה ב-buildy בתור {{role}} — כלי הניהול מוסתרים.',
    'dashboard.switchBackToAdmin': 'חזרה לתצוגת מנהל',
    'docs.noPreview': 'אין תצוגה מקדימה לסוג קובץ זה — הורידו אותו כדי לפתוח.',
    'docs.download': 'הורדה',
    'docs.fullscreen': 'מסך מלא',
    'docs.exitFullscreen': 'יציאה ממסך מלא',
    'docs.close': 'סגירה',
    'adminFab.tooltip': 'כלי ניהול',
    'adminFab.openConsole': 'פתיחת מסוף הניהול',
    'admin.consoleTitle': 'מסוף ניהול',
    'admin.searchBuildings': 'חיפוש בניינים',
    'admin.selectBuilding': 'בניין',
    'admin.noMatches': 'לא נמצאו בניינים תואמים.',
    'admin.backToApp': 'חזרה לאפליקציה',
    'admin.tabOverview': 'סקירה',
    'admin.tabMembers': 'דיירים',
    'admin.tabDocuments': 'מסמכים',
    'role.management_company': 'חברת ניהול',
    'members.management': 'הנהלת הבניין',
    'common.formerResident': 'דייר/ת לשעבר',
    'dashboard.editDetails': 'עריכת פרטים',
    'layout.sectionTitle': 'פריסת מסך הבית',
    'layout.editToggle': 'עריכת פריסת מסך הבית',
    'layout.editToggleHint': 'כשמופעל, רחפו מעל אריח במסך הבית כדי לגרור או לשנות את גודלו.',
    'layout.reset': 'איפוס הפריסה',
    'layout.resetDone': 'הפריסה אופסה',
    'layout.resetConfirmTitle': 'לאפס את הפריסה?',
    'layout.resetConfirmText': 'כל הווידג׳טים יחזרו למקום ולגודל ברירת המחדל, ווידג׳טים שהוסרו יחזרו.',
    'widgets.removeConfirmTitle': 'להסיר את {{name}}?',
    'widgets.removeConfirmText': 'אפשר להחזיר אותו בכל זמן מ״הוספת ווידג׳טים״.',
    'widgets.removeConfirmAction': 'הסרה',
    'layout.done': 'סיום',
    'layout.editingHint': 'עריכת הפריסה — גררו אריח בידית, שנו גודל מהפינה.',
    'layout.dragHandle': 'גררו כדי להזיז',
    'footer.feedback': 'משוב',
    'footer.privacy': 'פרטיות',
    'footer.terms': 'תנאים',
    'footer.copyright': '© {{year}} Buildy',
    'footer.comingSoon': 'הדף הזה יהיה זמין בקרוב.',
    'footer.back': 'חזרה',
    'footer.infoTitle': 'על Buildy',
    'footer.infoBody': 'Buildy עוזרת לדיירים ולוועד הבית לנהל את הבניין יחד. עוד על האפליקציה — בקרוב.',
    'feedback.title': 'שליחת משוב',
    'feedback.widgetTitle': 'רוצים לראות עוד ווידג׳טים?',
    'feedback.label': 'שתפו את הרעיון שלכם',
    'feedback.hint': 'ספרו לנו מה חסר או מה אפשר לשפר.',
    'feedback.send': 'שליחה',
    'feedback.thanks': 'תודה! אנחנו קוראים כל הודעה.',
    'widgets.add': 'הוספת ווידג׳טים',
    'widgets.menuTitle': 'ווידג׳טים',
    'docs.chooseFiles': 'בחרו קבצים (או גררו לכאן)',
    'docs.addMore': 'הוספת קבצים',
    'docs.uploadCount': 'העלאת {{count}} קבצים',
    'widgets.dragHint': 'גררו ווידג׳ט לדף הבית, או לחצו עליו כדי להוסיף.',
    'widgets.desc.building': 'כתובת, קוד כניסה וקישורי קשר.',
    'widgets.desc.apartments': 'הדירה שלכם, או כל הדירות שלכם בכל הבניינים.',
    'widgets.desc.members': 'שכנים וניהול הבניין.',
    'widgets.desc.issues': 'דיווח ומעקב אחרי תקלות בבניין.',
    'widgets.desc.docs': 'קבצים ומסמכים משותפים.',
    'widgets.empty': 'דף הבית ריק. הוסיפו ווידג׳ט כדי להתחיל.',
    'widgets.remove': 'הסרת ווידג׳ט',
    'widgets.allAdded': 'כל הווידג׳טים כבר בדף הבית שלכם.',
    'widgets.wantMore': 'רוצים לראות עוד ווידג׳טים?',
    'widgets.tellUs': 'ספרו לנו',
    'widgets.emptyHome': 'אין כאן כלום עדיין.',
    'widgets.tile.building': 'הבניין',
    'widgets.tile.apartments': 'הדירה שלי',
    'widgets.tile.members': 'חברים',
    'widgets.tile.issues': 'תקלות',
    'widgets.tile.docs': 'מסמכים',
    'widgets.tile.payments': 'תשלומים',
    'widgets.desc.payments': 'דמי ועד חודשיים: תקציב הבניין והחלק שלך.',
    'payments.budget': 'התקציב החודשי',
    'payments.myPart': 'החלק שלי',
    'payments.collected': 'נגבו ₪{{collected}} מתוך ₪{{goal}}',
    'payments.complete': 'נגבה במלואו',
    'payments.notOpened': 'החודש עדיין לא נפתח. פתיחה יוצרת חיוב לכל דירה לפי דמי הוועד החודשיים שלה.',
    'payments.notOpenedResident': 'הנהלת הבניין עדיין לא פתחה את החודש.',
    'payments.openMonth': 'פתיחת החודש',
    'payments.addNew': 'הוספת {{count}} דירות חדשות',
    'payments.markAll': 'סימון כולם כשולמו',
    'payments.markPaid': 'סימון כשולם',
    'payments.paid': 'שולם',
    'payments.unpaid': 'לא שולם',
    'payments.fee': '₪{{amount}}',
    'payments.noFee': 'לא נקבע סכום',
    'payments.editFee': 'שינוי סכום',
    'payments.feeTitle': 'סכום לדירה {{apartment}}',
    'payments.feeAmount': 'דמי ועד חודשיים (₪)',
    'payments.scopeOnce': 'החודש בלבד',
    'payments.scopePermanent': 'מעכשיו ולהבא',
    'payments.save': 'שמירה',
    'payments.cancel': 'ביטול',
    'payments.pay': 'תשלום',
    'payments.demoNote': 'הדגמה: התשלום כאן רק מסמן את החודש כשולם. לא עובר כסף אמיתי.',
    'payments.history': 'חודשים קודמים',
    'payments.noHistory': 'עדיין אין חודשים קודמים.',
    'payments.noApartments': 'אין לך דירות בבניין הזה.',
    'payments.error': 'משהו השתבש. נסו שוב.',
    'payments.confirmTitle': 'לסמן כשולם?',
    'payments.confirmOne': 'דירה {{apartment}} תסומן כשולמה לחודש הזה. אי אפשר לבטל.',
    'payments.confirmAll': 'כל הדירות שטרם שילמו יסומנו כשולמו לחודש הזה. אי אפשר לבטל.',
    'payments.noResidents': 'אין דיירים',
    'payments.setupTitle': 'הגדרת תשלומים',
    'payments.setupHint': 'בחרו איך כל חודש נפתח, את דמי הוועד ברירת המחדל ואיך הדירות משלמות בדרך כלל. אפשר לשנות אחר כך.',
    'payments.saveSetup': 'שמירה',
    'payments.settings': 'הגדרות תשלומים',
    'payments.openMode': 'פתיחת כל חודש',
    'payments.openManual': 'ידנית: לוחצים "פתיחת החודש"',
    'payments.openAuto': 'אוטומטית, ביום קבוע בחודש',
    'payments.openDay': 'יום הפתיחה (1–28)',
    'payments.defaultFee': 'דמי ועד חודשיים ברירת מחדל (₪)',
    'payments.defaultFeeHint': 'לכל דירה שאין לה סכום משלה.',
    'payments.defaultMethod': 'אמצעי תשלום ברירת מחדל',
    'payments.settingsNextMonth': 'השינויים חלים מהחודש הבא.',
    'payments.autoOpensOn': 'נפתח מעצמו ב-{{day}} בחודש.',
    'payments.method': 'אמצעי תשלום',
    'payments.log': 'יומן תשלומים',
    'payments.apartmentLog': 'יומן תשלומים',
    'payments.logTitleApartment': 'יומן תשלומים · דירה {{apartment}}',
    'payments.logEmpty': 'עדיין אין תשלומים.',
    'payments.filterAll': 'הכל',
    'payments.filterMonth': 'חודש',
    'payments.filterApartment': 'דירה',
    'payments.filterMethod': 'אמצעי',
    'payments.colMonth': 'עבור',
    'payments.colAmount': 'סכום',
    'payments.colStatus': 'סטטוס',
    'payments.colPaidOn': 'שולם ב-',
    'payments.colPaidBy': 'שולם על ידי',
    'payments.colConfirmedBy': 'אושר על ידי',
    'payments.colHow': 'אופן',
    'payments.confirmation.single': 'סומן על ידי ההנהלה',
    'payments.confirmation.bulk': 'סימון הכל (הנהלה)',
    'payments.confirmation.self': 'שולם על ידי הדייר',
    'payments.confirmation.automatic': 'אוטומטי',
    'payments.payer': 'משלם: {{name}}',
    'payments.payerYou': 'את/ה משלם/ת על הדירה הזאת.',
    'payments.payerOther': '{{name}} משלם/ת על הדירה הזאת.',
    'payments.whoPays': 'מי משלם',
    'payments.whoPaysHint': 'כבעלים, את/ה בוחר/ת מי משלם את דמי הוועד.',
    'payments.wizardTitle': 'תשלומים',
    'payments.wizardSubtitle': 'איך כל חודש נפתח, דמי הוועד ברירת המחדל ואיך הדירות משלמות בדרך כלל. אפשר לשנות אחר כך.',
    'issues.undo': 'ביטול',
    'issues.undoHint': 'אפשר לבטל ולערוך עד שהטיימר מסתיים.',
    'issues.draftRestored': 'ההודעה הקודמת חזרה, אפשר לערוך ולשלוח שוב.',
    'members.manage': 'ניהול',
    'members.manageTitle': 'ניהול {{name}}',
    'members.apartmentsTitle': 'דירות',
    'members.addApartment': 'הוספת דירה',
    'members.block': 'חסימה',
    'members.blockConfirm': 'לחסום את {{name}}?',
    'members.blockHint': 'הם יוסרו ולא יוכלו להצטרף שוב עד לביטול החסימה.',
    'members.removeHint': 'הנהלת הבניין יכולה להוסיף אותם שוב.',
    'members.blockedTitle': 'חסומים',
    'members.blockedBy': 'נחסם/ה על ידי {{name}}',
    'members.unblock': 'ביטול חסימה',
    'myUnit.setByManagement': 'הדירות ופרטי התשלום נקבעים על ידי הנהלת הבניין.',
    'settings.phoneLabel': 'טלפון',
    'settings.phoneHint': 'לא חובה. רק הנהלת הבניין ומנהלי המערכת רואים אותו.',
    'settings.phoneInvalid': 'מספר הטלפון נראה שגוי.',
    'settings.saveError': 'השמירה נכשלה. נסו שוב.',
    'settings.pictureTooLarge': 'התמונה גדולה מ-2MB.',
    'settings.pictureError': 'לא הצלחנו לעדכן את התמונה. נסו שוב.',
    'settings.deleteKeepsContent': "ההודעות והמסמכים שפרסמתם יישארו בבניין, ויוצגו כ'דייר/ת לשעבר'.",
    'picture.add': 'הוספת תמונת פרופיל',
    'picture.edit': 'עריכת תמונת הפרופיל',
    'picture.upload': 'העלאת קובץ',
    'picture.remove': 'הסרת התמונה',
    'picture.cropTitle': 'התאמת התמונה',
    'picture.cropHint': 'גררו כדי להזיז, והשתמשו במחוון לזום. העיגול הוא מה שאחרים יראו.',
    'picture.zoom': 'זום',
    'picture.notImage': 'נא לבחור קובץ תמונה.',
    'picture.pendingUpload': 'התמונה החדשה מוכנה — לחצו שמירה כדי לשמור אותה.',
    'picture.pendingRemove': 'התמונה תוסר כשתלחצו שמירה.',
    'userMenu.emailVerified': 'אימייל מאומת',
    'userMenu.signOut': 'התנתקות',
    'common.skip': 'דילוג',
    'themeStep.title': 'איך תרצו שזה ייראה?',
    'themeStep.subtitle': 'בהיר, כהה, או לפי המכשיר. אפשר לשנות בכל רגע בהגדרות.',
    'phoneStep.title': 'מספר הטלפון שלכם',
    'phoneStep.subtitle': 'לא חובה. רק הנהלת הבניין יכולה לראות אותו.',
    'pictureStep.title': 'הוסיפו תמונה',
    'pictureStep.subtitle': 'לא חובה. בלי תמונה נשתמש בתמונת Google שלכם או באותיות הראשונות.',
    'noBuilding.title': 'ברוכים הבאים, {{name}}',
    'noBuilding.explain': 'עוד לא צורפתם לבניין. שלחו את המזהה שלכם לוועד הבית או לחברת הניהול — ברגע שיוסיפו אתכם, הבניין יופיע כאן.',
    'noBuilding.idLabel': 'המזהה שלכם',
    'noBuilding.copy': 'העתקה',
    'noBuilding.copied': 'הועתק',
    'noBuilding.refresh': 'בדיקה מחדש',
    'noBuilding.aboutTitle': 'מה זה buildy?',
    'noBuilding.aboutBody': 'buildy מרכז את כל מה שקשור לבניין שלכם במקום אחד: שכנים, מסמכים, אנשי קשר ותקלות.',
    'noBuilding.createTitle': 'מנהלים בניין?',
    'noBuilding.createHint': 'ועד בית וחברות ניהול יכולים להקים את הבניין ולהוסיף את הדיירים.',
    'noBuilding.create': 'יצירת בניין',
    'dashboard.createBuilding': 'יצירת בניין',
    'settings.userIdHint': 'שתפו אותו עם ועד הבית כדי שיוסיפו אתכם לבניין.',
    'wizard.role.title': 'מה התפקיד שלכם?',
    'wizard.role.subtitle': 'תנהלו את הבניין הזה ותחליטו מי מצטרף אליו.',
    'wizard.role.label': 'התפקיד שלכם',
    'wizard.residents.title': 'הוסיפו את הדיירים',
    'wizard.residents.subtitle': 'לא חובה. הדביקו את המזהים ששלחו לכם הדיירים — אפשר גם מאוחר יותר מרשימת החברים.',
    'wizard.duplicateError': 'כבר קיים בניין בכתובת הזו בעיר. אם הוא שלכם, פנו לתמיכה.',
    'residents.addButton': 'הוספת דיירים',
    'residents.addTitle': 'הוספת דיירים',
    'residents.addHint': 'הדביקו את כל המזהים בבת אחת והגדירו את הדירות למטה. הם יתווספו מיד.',
    'residents.pasteLabel': 'מזהי משתמשים',
    'residents.pasteHint': 'הדביקו את כל הטקסט שקיבלתם — אנחנו נחלץ ממנו את המזהים.',
    'residents.addToList': 'הוספה לרשימה',
    'residents.lookingUp': 'מחפשים…',
    'residents.noneFound': 'לא נמצאו מזהים בטקסט.',
    'residents.notFound': '{{count}} מזהים לא נמצאו: {{ids}}',
    'residents.lookupError': 'לא הצלחנו לחפש. נסו שוב.',
    'residents.empty': 'עדיין אין אף אחד ברשימה.',
    'residents.setForAll': 'הגדרה לכולם',
    'residents.setForAllHint': 'מלאו רק מה שרוצים להגדיר — שדות ריקים לא ישתנו.',
    'residents.applyAll': 'החלה על כולם',
    'residents.relation': 'בעלים / שוכר',
    'residents.toAdd': '{{count}} להוספה',
    'residents.removeRow': 'הסרה מהרשימה',
    'residents.alreadyMember': 'כבר בבניין',
    'residents.blocked': 'חסום — בטלו חסימה קודם',
    'residents.isMe': 'זה אתם',
    'residents.needApartments': 'לכל אחד נדרש מספר דירה.',
    'residents.add': 'הוספת {{count}}',
    'residents.addError': 'לא הצלחנו להוסיף. נסו שוב.',
    'issues.title': 'תקלות',
    'issues.new': 'דיווח על תקלה',
    'issues.empty': 'עדיין לא דווחו תקלות.',
    'issues.emptyFiltered': 'אין תקלות בסטטוס הזה.',
    'issues.titleLabel': 'מה הבעיה?',
    'issues.descriptionLabel': 'פרטים (לא חובה)',
    'issues.attach': 'הוספת תמונות או קבצים',
    'issues.attachHint': 'עד 10 קבצים, 10MB כל אחד.',
    'issues.tooMany': 'עד 10 קבצים.',
    'issues.post': 'דיווח',
    'issues.postError': 'לא הצלחנו לדווח. נסו שוב.',
    'issues.editTitle': 'עריכת תקלה',
    'issues.deleteTitle': 'למחוק את התקלה?',
    'issues.deleteBody': 'היא והקבצים שלה יוסרו עבור כל דיירי הבניין.',
    'issues.actionError': 'משהו השתבש. נסו שוב.',
    'issues.status.opened': 'נפתחה',
    'issues.status.in_process': 'בטיפול',
    'issues.status.denied': 'נדחתה',
    'issues.status.resolved': 'נפתרה',
    'issues.pinged': 'הוזכרה',
    'issues.ping': 'תזכורת',
    'issues.pingHint': 'מחזירה את התקלה לראש הרשימה. פעם בשבוע.',
    'issues.pingAvailable': 'אפשר לשלוח תזכורת שוב ב-{{date}}.',
    'issues.pingWait': 'אפשר לשלוח תזכורת פעם בשבוע.',
    'issues.reportedBy': 'דווחה על ידי {{name}} ב-{{date}}',
    'issues.history': 'היסטוריה',
    'issues.noteLabel': 'הערה (חובה)',
    'issues.noteHint': 'הסבירו את ההחלטה או מה הצעד הבא. אפשר גם לצרף תמונות או קבצים.',
    'admin.tabIssues': 'תקלות',
    'issues.action.in_process': 'קבלת התקלה לטיפול',
    'issues.action.denied': 'דחיית התקלה',
    'issues.action.resolved': 'סימון כנפתרה',
    'issues.addUpdate': 'הוספת עדכון',
    'issues.updateLabel': 'הודעה',
    'issues.updateHint': 'הוסיפו הודעה, תמונות או קבצים — לפחות אחד.',
    'issues.send': 'שליחה',
    'issues.closed': 'התקלה סגורה — אי אפשר לשנות בה יותר דבר.',
    'issues.updateChip': 'עדכון',
  },
  ar: {
    'common.continue': 'متابعة',
    'common.finish': 'إنهاء',
    'common.getStarted': 'ابدأ الآن',
    'common.welcomeToBuildy': 'مرحبًا بكم في buildy',
    'common.edit': 'تعديل',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'language.title': 'اختر لغتك',
    'language.subtitle': 'يمكنك تغيير ذلك لاحقًا في الإعدادات.',
    'language.confirm': 'تم حفظ اللغة',
    'name.title': 'كيف يمكننا مناداتك؟',
    'name.subtitle': 'هكذا ستظهر لجيرانك.',
    'name.placeholder': 'اسمك الكامل',
    'name.confirm': 'سعيدون بلقائك، {{name}}',
    'home.title': 'buildy',
    'home.tagline': 'كل ما يخص مبناك، في مكان واحد',
    'home.signInPrompt': 'سجّل الدخول لعرض مستندات المبنى والشؤون المالية والإشعارات',
    'home.signInButton': 'تسجيل الدخول عبر Google',
    'dashboard.welcome': 'مرحبًا بعودتك، {{name}}',
    'nav.home': 'الرئيسية',
    'nav.issues': 'الأعطال',
    'nav.money': 'المال',
    'nav.docs': 'المستندات',
    'nav.people': 'السكان',
    'nav.label': 'الأقسام',
    'language.partial': 'ترجمة جزئية',
    'payments.slideToPay': 'اسحب للدفع ₪{{amount}}',
    'payments.sending': 'جارٍ الإرسال…',
    'payments.paidThanks': 'تم الدفع، شكرًا',
    'door.hold': 'اضغط مطولاً للعرض',
    'door.tapToCopy': 'اضغط على الرمز للنسخ',
    'door.copied': 'تم النسخ',
    'greeting.morning': 'صباح الخير، {{name}}',
    'greeting.afternoon': 'نهارك سعيد، {{name}}',
    'greeting.evening': 'مساء الخير، {{name}}',
    'greeting.night': 'تصبح على خير، {{name}}',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.reportIssue': 'الإبلاغ عن مشكلة',
    'dashboard.building': 'المبنى',
    'dashboard.filterAll': 'الكل',
    'dashboard.entryCode': 'رمز الباب',
    'dashboard.memberCount': '{{count}} من السكان على buildy',
    'dashboard.contacts': 'التواصل مع المبنى',
    'contactType.whatsapp': 'مجموعة واتساب',
    'contactType.phone': 'هاتف',
    'contactType.email': 'البريد الإلكتروني',
    'myUnit.title': 'شققي',
    'myUnit.empty': 'لم تربطك إدارة المبنى بشقة بعد.',
    'myUnit.apartment': 'الشقة',
    'myUnit.floor': 'الطابق',
    'myUnit.relation': 'أنا',
    'myUnit.sqrm': 'المساحة (م²)',
    'myUnit.paymentMethod': 'طريقة الدفع',
    'myUnit.monthlyPayment': 'الرسوم الشهرية',
    'relationType.owner': 'مالك',
    'relationType.tenant': 'مستأجر',
    'paymentMethod.card': 'بطاقة ائتمان',
    'paymentMethod.cash': 'نقدًا',
    'paymentMethod.transfer': 'تحويل بنكي',
    'paymentMethod.bit_paybox': 'Bit / PayBox',
    'settings.title': 'إعدادات الحساب',
    'settings.subtitle': 'إدارة ملفك الشخصي وحسابك',
    'settings.email': 'البريد الإلكتروني',
    'settings.emailVerified': 'تم التحقق من البريد الإلكتروني',
    'settings.verified': 'تم التحقق',
    'settings.notVerified': 'غير موثق',
    'settings.backToHome': 'العودة إلى الصفحة الرئيسية',
    'settings.nameLabel': 'الاسم',
    'settings.languageLabel': 'اللغة',
    'settings.dangerZoneTitle': 'منطقة الخطر',
    'settings.dangerZoneDescription': 'سيؤدي حذف حسابك إلى إزالة ملفك الشخصي وبياناتك نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
    'settings.deleteAccountButton': 'حذف الحساب',
    'settings.deleteDialogTitle': 'هل تريد حذف حسابك؟',
    'settings.deleteDialogDescription':
      'سيؤدي هذا إلى حذف ملفك الشخصي في buildy نهائيًا وإزالة وصولك. لا يمكن التراجع عن هذا الإجراء.',
    'settings.deleteConfirmInstruction': 'اكتب "{{phrase}}" للتأكيد.',
    'settings.deleteConfirmPlaceholder': 'اكتب {{phrase}}',
    'settings.leaveBuildingTitle': 'مغادرة المبنى',
    'settings.leaveBuildingDescription': 'سيُطلب منك الانضمام إلى مبنى مرة أخرى في المرة القادمة التي تسجل فيها الدخول.',
    'settings.leaveBuildingButton': 'مغادرة المبنى',
    'settings.leaveDialogTitle': 'هل تريد مغادرة هذا المبنى؟',
    'settings.leaveDialogDescription': 'ستفقد الوصول إلى مشاكل ومعلومات هذا المبنى حتى تنضم إليه مرة أخرى.',
    'settings.leaveConfirmInstruction': 'اكتب "{{phrase}}" للتأكيد.',
    'settings.leaveConfirmPlaceholder': 'اكتب {{phrase}}',
    'common.delete': 'حذف',
    'admin.sectionTitle': 'الإدارة',
    'admin.sectionDescription': 'إنشاء المباني ورسائلها وتعديلها وحذفها.',
    'admin.openPanel': 'فتح لوحة الإدارة',
    'admin.subtitle': 'كل ما يمكنك إدارته كمسؤول في buildy.',
    'admin.newBuilding': 'مبنى جديد',
    'admin.stats': '{{members}} ساكن · {{messages}} رسالة · {{docs}} مستند',
    'admin.noBuildings': 'لا توجد مبانٍ بعد.',
    'admin.editBuilding': 'تعديل المبنى',
    'admin.deleteTitle': 'حذف {{name}}؟',
    'admin.deleteBody': 'سيؤدي هذا إلى حذف المبنى نهائيًا مع عضويات سكانه ورسائله ومستنداته.',
    'admin.deleteConfirmInstruction': 'اكتب اسم المبنى للتأكيد.',
    'admin.saveError': 'تعذّر حفظ المبنى. يرجى المحاولة مرة أخرى.',
    'admin.duplicateError': 'يوجد مبنى بهذا العنوان في هذه المدينة بالفعل.',
    'admin.identityAdminOnly': 'يمكن للمسؤول فقط تغيير الاسم والمدينة والعنوان',
    'admin.fieldName': 'الاسم',
    'admin.fieldCity': 'المدينة',
    'admin.fieldAddress': 'العنوان',
    'admin.fieldDescription': 'الوصف',
    'wizard.name.title': 'ما اسم المبنى؟',
    'wizard.name.subtitle': 'سيرى السكان هذا الاسم في شاشتهم الرئيسية.',
    'wizard.name.placeholder': 'مثال: بيت القيقب',
    'wizard.city.title': 'في أي مدينة يقع؟',
    'wizard.city.subtitle': 'ابدأ الكتابة للبحث في القائمة الرسمية للمدن والبلدات.',
    'wizard.city.placeholder': 'ابحث عن مدينة',
    'wizard.address.title': 'ما عنوان الشارع؟',
    'wizard.address.subtitle': 'الشارع والرقم.',
    'wizard.address.placeholder': 'مثال: بن يهودا 14',
    'wizard.details.title': 'بعض التفاصيل',
    'wizard.details.subtitle': 'اختياري — يمكنك إكمالها لاحقًا.',
    'wizard.review.title': 'جاهز للإنشاء؟',
    'wizard.review.subtitle': 'تحقق من التفاصيل أدناه.',
    'wizard.review.create': 'إنشاء المبنى',
    'wizard.done': 'تم إنشاء المبنى',
    'role.committee_head': 'رئيس اللجنة',
    'role.resident': 'ساكن',
    'members.title': 'السكان',
    'members.residents': 'السكان',
    'members.count': '{{count}} ساكن',
    'members.unnamed': 'ساكن بلا اسم',
    'members.apartment': 'شقة {{apartment}}',
    'members.floor': 'الطابق {{floor}}',
    'members.viewAll': 'عرض الكل',
    'members.you': 'أنت',
    'members.remove': 'إزالة من المبنى',
    'members.removeConfirm': 'إزالة {{name}} من المبنى؟',
    'members.roleLabel': 'الدور',
    'members.empty': 'لا يوجد سكان بعد.',
    'members.actionError': 'تعذّر تحديث الساكن. يرجى المحاولة مرة أخرى.',
    'docs.title': 'المستندات',
    'docs.upload': 'رفع',
    'docs.uploadTitle': 'رفع مستند',
    'docs.chooseFile': 'اختيار ملف',
    'docs.fileHint': 'PDF أو Word أو Excel أو PowerPoint أو صور أو نص · حتى 10 ميغابايت',
    'docs.titleLabel': 'العنوان (اختياري)',
    'docs.empty': 'لا توجد مستندات بعد.',
    'docs.uploadError': 'تعذّر رفع الملف. يرجى المحاولة مرة أخرى.',
    'docs.tooLarge': 'حجم الملف أكبر من 10 ميغابايت.',
    'docs.badType': 'نوع الملف هذا غير مدعوم.',
    'docs.renameTitle': 'إعادة تسمية المستند',
    'docs.deleteTitle': 'حذف هذا المستند؟',
    'docs.deleteBody': 'سيُزال لجميع سكان المبنى.',
    'docs.actionError': 'تعذّر تحديث المستند. يرجى المحاولة مرة أخرى.',
    'docs.downloadError': 'تعذّر فتح الملف.',
    'dashboard.uploadDocument': 'رفع مستند',
    'dashboard.viewMembers': 'سكان المبنى',
    'dashboard.noContacts': 'لا توجد روابط تواصل بعد.',
    'admin.contactsTitle': 'روابط التواصل',
    'admin.addContact': 'إضافة',
    'admin.contactLinkLabel': 'رابط أو رقم أو بريد إلكتروني',
    'admin.contactError': 'تحقق من الرابط: واتساب يحتاج رابط https://، والهاتف رقمًا، والبريد عنوانًا.',
    'wizard.contacts.title': 'كيف يمكن للسكان التواصل مع اللجنة؟',
    'wizard.contacts.subtitle': 'أضف مجموعة واتساب أو هاتفًا أو بريدًا إلكترونيًا. يمكنك إضافة المزيد لاحقًا.',
    'settings.profileTitle': 'الملف الشخصي',
    'settings.editProfile': 'تعديل الملف الشخصي',
    'settings.preferencesTitle': 'تفضيلات التطبيق',
    'settings.preferencesSubtitle': 'تُحفظ على هذا الجهاز.',
    'settings.themeLabel': 'المظهر',
    'settings.accountTitle': 'الحساب',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'حسب النظام',
    'userMenu.profile': 'تعديل الملف الشخصي',
    'userMenu.preferences': 'تفضيلات التطبيق',
    'adminFab.viewAs': 'العرض بصفة',
    'adminFab.viewAsHint': 'معاينة buildy بأحد هذه الأدوار',
    'adminFab.roleAdmin': 'مسؤول (وصول كامل)',
    'dashboard.viewingAs': 'أنت تشاهد buildy بصفة {{role}} — أدوات الإدارة مخفية.',
    'dashboard.switchBackToAdmin': 'العودة إلى وضع المسؤول',
    'docs.noPreview': 'لا تتوفر معاينة لهذا النوع من الملفات — نزّله لفتحه.',
    'docs.download': 'تنزيل',
    'docs.fullscreen': 'ملء الشاشة',
    'docs.exitFullscreen': 'الخروج من ملء الشاشة',
    'docs.close': 'إغلاق',
    'adminFab.tooltip': 'أدوات الإدارة',
    'adminFab.openConsole': 'فتح وحدة الإدارة',
    'admin.consoleTitle': 'وحدة الإدارة',
    'admin.searchBuildings': 'البحث عن مبانٍ',
    'admin.selectBuilding': 'المبنى',
    'admin.noMatches': 'لا توجد مبانٍ مطابقة.',
    'admin.backToApp': 'العودة إلى التطبيق',
    'admin.tabOverview': 'نظرة عامة',
    'admin.tabMembers': 'السكان',
    'admin.tabDocuments': 'المستندات',
    'role.management_company': 'شركة إدارة',
    'members.management': 'إدارة المبنى',
    'common.formerResident': 'ساكن سابق',
    'dashboard.editDetails': 'تعديل التفاصيل',
    'layout.sectionTitle': 'تخطيط الشاشة الرئيسية',
    'layout.editToggle': 'تعديل تخطيط الشاشة الرئيسية',
    'layout.editToggleHint': 'عند التفعيل، مرّر فوق أي مربع في الشاشة الرئيسية لسحبه أو تغيير حجمه.',
    'layout.reset': 'إعادة ضبط التخطيط',
    'layout.resetDone': 'تمت إعادة ضبط التخطيط',
    'layout.done': 'تم',
    'layout.editingHint': 'تعديل التخطيط — اسحب المربع من المقبض، وغيّر حجمه من الزاوية.',
    'layout.dragHandle': 'اسحب للتحريك',
    'members.manage': 'إدارة',
    'members.manageTitle': 'إدارة {{name}}',
    'members.apartmentsTitle': 'الشقق',
    'members.addApartment': 'إضافة شقة',
    'members.block': 'حظر',
    'members.blockConfirm': 'حظر {{name}}؟',
    'members.blockHint': 'ستتم إزالته ولن يتمكن من الانضمام مجددًا حتى يُلغى الحظر.',
    'members.blockedTitle': 'المحظورون',
    'members.blockedBy': 'حظره {{name}}',
    'members.unblock': 'إلغاء الحظر',
    'myUnit.setByManagement': 'تحدد إدارة المبنى الشقق وتفاصيل الدفع.',
    'settings.phoneLabel': 'الهاتف',
    'settings.phoneHint': 'اختياري. لا يراه إلا إدارة المبنى والمسؤولون.',
    'settings.phoneInvalid': 'يبدو رقم الهاتف غير صحيح.',
    'settings.saveError': 'تعذّر الحفظ. يرجى المحاولة مرة أخرى.',
    'settings.pictureTooLarge': 'حجم الصورة أكبر من 2 ميغابايت.',
    'settings.pictureError': 'تعذّر تحديث صورتك. يرجى المحاولة مرة أخرى.',
    'settings.deleteKeepsContent': "تبقى الرسائل والمستندات التي نشرتها في المبنى، وتظهر باسم 'ساكن سابق'.",
    'picture.add': 'إضافة صورة الملف الشخصي',
    'picture.edit': 'تعديل صورة الملف الشخصي',
    'picture.upload': 'رفع ملف',
    'picture.remove': 'إزالة الصورة',
    'picture.cropTitle': 'اضبط صورتك',
    'picture.cropHint': 'اسحب للتحريك واستخدم الشريط للتكبير. الدائرة هي ما سيراه الآخرون.',
    'picture.zoom': 'تكبير',
    'picture.notImage': 'يرجى اختيار ملف صورة.',
    'picture.pendingUpload': 'الصورة الجديدة جاهزة — اضغط حفظ للاحتفاظ بها.',
    'picture.pendingRemove': 'ستُزال الصورة عند الضغط على حفظ.',
    'userMenu.emailVerified': 'البريد الإلكتروني موثّق',
    'userMenu.signOut': 'تسجيل الخروج',
  },
  ru: {
    'common.continue': 'Продолжить',
    'common.finish': 'Готово',
    'common.getStarted': 'Начать',
    'common.welcomeToBuildy': 'Добро пожаловать в buildy',
    'common.edit': 'Изменить',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'language.title': 'Выберите язык',
    'language.subtitle': 'Вы можете изменить это позже в настройках.',
    'language.confirm': 'Язык сохранён',
    'name.title': 'Как к вам обращаться?',
    'name.subtitle': 'Именно так вас увидят соседи.',
    'name.placeholder': 'Ваше полное имя',
    'name.confirm': 'Приятно познакомиться, {{name}}',
    'home.title': 'buildy',
    'home.tagline': 'Всё о вашем доме в одном месте',
    'home.signInPrompt': 'Войдите, чтобы видеть документы дома, финансы и объявления',
    'home.signInButton': 'Войти через Google',
    'dashboard.welcome': 'С возвращением, {{name}}',
    'nav.home': 'Главная',
    'nav.issues': 'Проблемы',
    'nav.money': 'Деньги',
    'nav.docs': 'Документы',
    'nav.people': 'Жильцы',
    'nav.label': 'Разделы',
    'language.partial': 'частичный перевод',
    'payments.slideToPay': 'Сдвиньте, чтобы оплатить ₪{{amount}}',
    'payments.sending': 'Отправка…',
    'payments.paidThanks': 'Оплачено, спасибо',
    'door.hold': 'Удерживайте, чтобы показать',
    'door.tapToCopy': 'Нажмите на код, чтобы скопировать',
    'door.copied': 'Скопировано',
    'greeting.morning': 'Доброе утро, {{name}}',
    'greeting.afternoon': 'Добрый день, {{name}}',
    'greeting.evening': 'Добрый вечер, {{name}}',
    'greeting.night': 'Доброй ночи, {{name}}',
    'dashboard.quickActions': 'Быстрые действия',
    'dashboard.reportIssue': 'Сообщить о проблеме',
    'dashboard.building': 'Дом',
    'dashboard.filterAll': 'Все',
    'dashboard.entryCode': 'Код двери',
    'dashboard.memberCount': 'Жильцов в buildy: {{count}}',
    'dashboard.contacts': 'Связь с домом',
    'contactType.whatsapp': 'Группа WhatsApp',
    'contactType.phone': 'Телефон',
    'contactType.email': 'Эл. почта',
    'myUnit.title': 'Мои квартиры',
    'myUnit.empty': 'Управление домом ещё не привязало к вам квартиру.',
    'myUnit.apartment': 'Квартира',
    'myUnit.floor': 'Этаж',
    'myUnit.relation': 'Я',
    'myUnit.sqrm': 'Площадь (м²)',
    'myUnit.paymentMethod': 'Способ оплаты',
    'myUnit.monthlyPayment': 'Ежемесячный взнос',
    'relationType.owner': 'Владелец',
    'relationType.tenant': 'Арендатор',
    'paymentMethod.card': 'Банковская карта',
    'paymentMethod.cash': 'Наличные',
    'paymentMethod.transfer': 'Банковский перевод',
    'paymentMethod.bit_paybox': 'Bit / PayBox',
    'settings.title': 'Настройки аккаунта',
    'settings.subtitle': 'Управляйте профилем и аккаунтом',
    'settings.email': 'Email',
    'settings.emailVerified': 'Email подтверждён',
    'settings.verified': 'Подтверждено',
    'settings.notVerified': 'Не подтверждено',
    'settings.backToHome': 'Назад на главную',
    'settings.nameLabel': 'Имя',
    'settings.languageLabel': 'Язык',
    'settings.dangerZoneTitle': 'Опасная зона',
    'settings.dangerZoneDescription':
      'Удаление аккаунта безвозвратно удалит ваш профиль и данные. Это действие нельзя отменить.',
    'settings.deleteAccountButton': 'Удалить аккаунт',
    'settings.deleteDialogTitle': 'Удалить аккаунт?',
    'settings.deleteDialogDescription':
      'Это безвозвратно удалит ваш профиль buildy и лишит вас доступа. Это действие нельзя отменить.',
    'settings.deleteConfirmInstruction': 'Введите «{{phrase}}», чтобы подтвердить.',
    'settings.deleteConfirmPlaceholder': 'Введите {{phrase}}',
    'settings.leaveBuildingTitle': 'Покинуть дом',
    'settings.leaveBuildingDescription': 'При следующем входе вам нужно будет снова присоединиться к дому.',
    'settings.leaveBuildingButton': 'Покинуть дом',
    'settings.leaveDialogTitle': 'Покинуть этот дом?',
    'settings.leaveDialogDescription':
      'Вы потеряете доступ к проблемам и информации этого дома, пока не присоединитесь снова.',
    'settings.leaveConfirmInstruction': 'Введите «{{phrase}}», чтобы подтвердить.',
    'settings.leaveConfirmPlaceholder': 'Введите {{phrase}}',
    'common.delete': 'Удалить',
    'admin.sectionTitle': 'Администрирование',
    'admin.sectionDescription': 'Создание, редактирование и удаление домов и их сообщений.',
    'admin.openPanel': 'Открыть панель администратора',
    'admin.subtitle': 'Всё, чем вы можете управлять как администратор buildy.',
    'admin.newBuilding': 'Новый дом',
    'admin.stats': 'Жильцов: {{members}} · сообщений: {{messages}} · документов: {{docs}}',
    'admin.noBuildings': 'Домов пока нет.',
    'admin.editBuilding': 'Редактировать дом',
    'admin.deleteTitle': 'Удалить {{name}}?',
    'admin.deleteBody': 'Дом будет удалён навсегда вместе с привязками жильцов, сообщениями и документами.',
    'admin.deleteConfirmInstruction': 'Введите название дома для подтверждения.',
    'admin.saveError': 'Не удалось сохранить дом. Попробуйте ещё раз.',
    'admin.duplicateError': 'Дом с таким адресом в этом городе уже существует.',
    'admin.identityAdminOnly': 'Название, город и адрес может изменить только администратор',
    'admin.fieldName': 'Название',
    'admin.fieldCity': 'Город',
    'admin.fieldAddress': 'Адрес',
    'admin.fieldDescription': 'Описание',
    'wizard.name.title': 'Как называется дом?',
    'wizard.name.subtitle': 'Жильцы увидят это название на главном экране.',
    'wizard.name.placeholder': 'Например: Maple Court',
    'wizard.city.title': 'В каком городе он находится?',
    'wizard.city.subtitle': 'Начните вводить, чтобы найти город в официальном списке населённых пунктов.',
    'wizard.city.placeholder': 'Поиск города',
    'wizard.address.title': 'Какой адрес?',
    'wizard.address.subtitle': 'Улица и номер дома.',
    'wizard.address.placeholder': 'Например: Бен Иегуда 14',
    'wizard.details.title': 'Немного подробностей',
    'wizard.details.subtitle': 'Необязательно — можно заполнить позже.',
    'wizard.review.title': 'Готовы создать?',
    'wizard.review.subtitle': 'Проверьте данные ниже.',
    'wizard.review.create': 'Создать дом',
    'wizard.done': 'Дом создан',
    'role.committee_head': 'Председатель комитета',
    'role.resident': 'Жилец',
    'members.title': 'Жильцы',
    'members.residents': 'Жильцы',
    'members.count': 'Жильцов: {{count}}',
    'members.unnamed': 'Жилец без имени',
    'members.apartment': 'Кв. {{apartment}}',
    'members.floor': 'Этаж {{floor}}',
    'members.viewAll': 'Показать всех',
    'members.you': 'Вы',
    'members.remove': 'Удалить из дома',
    'members.removeConfirm': 'Удалить {{name}} из дома?',
    'members.roleLabel': 'Роль',
    'members.empty': 'Жильцов пока нет.',
    'members.actionError': 'Не удалось обновить жильца. Попробуйте ещё раз.',
    'docs.title': 'Документы',
    'docs.upload': 'Загрузить',
    'docs.uploadTitle': 'Загрузить документ',
    'docs.chooseFile': 'Выбрать файл',
    'docs.fileHint': 'PDF, Word, Excel, PowerPoint, изображения или текст · до 10 МБ',
    'docs.titleLabel': 'Название (необязательно)',
    'docs.empty': 'Документов пока нет.',
    'docs.uploadError': 'Не удалось загрузить файл. Попробуйте ещё раз.',
    'docs.tooLarge': 'Файл больше 10 МБ.',
    'docs.badType': 'Этот тип файла не поддерживается.',
    'docs.renameTitle': 'Переименовать документ',
    'docs.deleteTitle': 'Удалить этот документ?',
    'docs.deleteBody': 'Он исчезнет для всех жильцов дома.',
    'docs.actionError': 'Не удалось обновить документ. Попробуйте ещё раз.',
    'docs.downloadError': 'Не удалось открыть файл.',
    'dashboard.uploadDocument': 'Загрузить документ',
    'dashboard.viewMembers': 'Жильцы дома',
    'dashboard.noContacts': 'Контактов пока нет.',
    'admin.contactsTitle': 'Контакты',
    'admin.addContact': 'Добавить',
    'admin.contactLinkLabel': 'Ссылка, номер или email',
    'admin.contactError': 'Проверьте ссылку: для WhatsApp нужна ссылка https://, для телефона — номер, для почты — адрес.',
    'wizard.contacts.title': 'Как жильцы могут связаться с комитетом?',
    'wizard.contacts.subtitle': 'Добавьте группу WhatsApp, телефон или email. Позже можно добавить ещё.',
    'settings.profileTitle': 'Профиль',
    'settings.editProfile': 'Редактировать профиль',
    'settings.preferencesTitle': 'Настройки приложения',
    'settings.preferencesSubtitle': 'Сохраняются на этом устройстве.',
    'settings.themeLabel': 'Оформление',
    'settings.accountTitle': 'Аккаунт',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',
    'theme.system': 'Как в системе',
    'userMenu.profile': 'Редактировать профиль',
    'userMenu.preferences': 'Настройки приложения',
    'adminFab.viewAs': 'Смотреть как',
    'adminFab.viewAsHint': 'Просмотр buildy в одной из этих ролей',
    'adminFab.roleAdmin': 'Администратор (полный доступ)',
    'dashboard.viewingAs': 'Вы просматриваете buildy в роли «{{role}}» — инструменты администратора скрыты.',
    'dashboard.switchBackToAdmin': 'Вернуться в режим администратора',
    'docs.noPreview': 'Для этого типа файла нет предпросмотра — скачайте его, чтобы открыть.',
    'docs.download': 'Скачать',
    'docs.fullscreen': 'Во весь экран',
    'docs.exitFullscreen': 'Выйти из полноэкранного режима',
    'docs.close': 'Закрыть',
    'adminFab.tooltip': 'Инструменты администратора',
    'adminFab.openConsole': 'Открыть консоль администратора',
    'admin.consoleTitle': 'Консоль администратора',
    'admin.searchBuildings': 'Поиск домов',
    'admin.selectBuilding': 'Дом',
    'admin.noMatches': 'Нет подходящих домов.',
    'admin.backToApp': 'Назад в приложение',
    'admin.tabOverview': 'Обзор',
    'admin.tabMembers': 'Жильцы',
    'admin.tabDocuments': 'Документы',
    'role.management_company': 'Управляющая компания',
    'members.management': 'Управление домом',
    'common.formerResident': 'Бывший жилец',
    'dashboard.editDetails': 'Изменить данные',
    'layout.sectionTitle': 'Раскладка главного экрана',
    'layout.editToggle': 'Редактировать раскладку',
    'layout.editToggleHint': 'Если включено, наведите на плитку на главном экране, чтобы перетащить или изменить размер.',
    'layout.reset': 'Сбросить раскладку',
    'layout.resetDone': 'Раскладка сброшена',
    'layout.done': 'Готово',
    'layout.editingHint': 'Редактирование раскладки — тяните плитку за ручку, меняйте размер за угол.',
    'layout.dragHandle': 'Перетащите, чтобы переместить',
    'members.manage': 'Управлять',
    'members.manageTitle': 'Управление: {{name}}',
    'members.apartmentsTitle': 'Квартиры',
    'members.addApartment': 'Добавить квартиру',
    'members.block': 'Заблокировать',
    'members.blockConfirm': 'Заблокировать {{name}}?',
    'members.blockHint': 'Жилец будет удалён и не сможет вернуться, пока его не разблокируют.',
    'members.blockedTitle': 'Заблокированные',
    'members.blockedBy': 'Заблокировал(а): {{name}}',
    'members.unblock': 'Разблокировать',
    'myUnit.setByManagement': 'Квартиры и данные об оплате задаёт управление дома.',
    'settings.phoneLabel': 'Телефон',
    'settings.phoneHint': 'Необязательно. Видят только управление дома и администраторы.',
    'settings.phoneInvalid': 'Похоже, номер указан неверно.',
    'settings.saveError': 'Не удалось сохранить. Попробуйте ещё раз.',
    'settings.pictureTooLarge': 'Фото больше 2 МБ.',
    'settings.pictureError': 'Не удалось обновить фото. Попробуйте ещё раз.',
    'settings.deleteKeepsContent': 'Ваши сообщения и документы останутся в доме с подписью «Бывший жилец».',
    'picture.add': 'Добавить фото профиля',
    'picture.edit': 'Изменить фото профиля',
    'picture.upload': 'Загрузить файл',
    'picture.remove': 'Удалить фото',
    'picture.cropTitle': 'Настройте фото',
    'picture.cropHint': 'Перетащите, чтобы сдвинуть, ползунок — масштаб. Круг — то, что увидят другие.',
    'picture.zoom': 'Масштаб',
    'picture.notImage': 'Выберите файл изображения.',
    'picture.pendingUpload': 'Новое фото готово — нажмите «Сохранить».',
    'picture.pendingRemove': 'Фото будет удалено после нажатия «Сохранить».',
    'userMenu.emailVerified': 'Email подтверждён',
    'userMenu.signOut': 'Выйти',
  },
  fr: {
    'common.continue': 'Continuer',
    'common.finish': 'Terminer',
    'common.getStarted': 'Commencer',
    'common.welcomeToBuildy': 'Bienvenue sur buildy',
    'common.edit': 'Modifier',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'language.title': 'Choisissez votre langue',
    'language.subtitle': 'Vous pourrez la modifier plus tard dans les paramètres.',
    'language.confirm': 'Langue enregistrée',
    'name.title': 'Comment devons-nous vous appeler ?',
    'name.subtitle': "C'est ainsi que vous apparaîtrez à vos voisins.",
    'name.placeholder': 'Votre nom complet',
    'name.confirm': 'Ravi de vous rencontrer, {{name}}',
    'home.title': 'buildy',
    'home.tagline': 'Tout sur votre immeuble, au même endroit',
    'home.signInPrompt':
      "Connectez-vous pour consulter les documents, finances et annonces de l'immeuble",
    'home.signInButton': 'Se connecter avec Google',
    'dashboard.welcome': 'Bon retour, {{name}}',
    'nav.home': 'Accueil',
    'nav.issues': 'Problèmes',
    'nav.money': 'Argent',
    'nav.docs': 'Documents',
    'nav.people': 'Résidents',
    'nav.label': 'Sections',
    'language.partial': 'traduction partielle',
    'payments.slideToPay': 'Glissez pour payer ₪{{amount}}',
    'payments.sending': 'Envoi…',
    'payments.paidThanks': 'Payé, merci',
    'door.hold': 'Maintenez pour afficher',
    'door.tapToCopy': 'Touchez le code pour le copier',
    'door.copied': 'Copié',
    'greeting.morning': 'Bonjour, {{name}}',
    'greeting.afternoon': 'Bon après-midi, {{name}}',
    'greeting.evening': 'Bonsoir, {{name}}',
    'greeting.night': 'Bonne nuit, {{name}}',
    'dashboard.quickActions': 'Actions rapides',
    'dashboard.reportIssue': 'Signaler un problème',
    'dashboard.building': 'Immeuble',
    'dashboard.filterAll': 'Tous',
    'dashboard.entryCode': "Code d'entrée",
    'dashboard.memberCount': '{{count}} résidents sur buildy',
    'dashboard.contacts': "Contacter l'immeuble",
    'contactType.whatsapp': 'Groupe WhatsApp',
    'contactType.phone': 'Téléphone',
    'contactType.email': 'E-mail',
    'myUnit.title': 'Mes appartements',
    'myUnit.empty': "La gestion de l'immeuble ne vous a pas encore associé d'appartement.",
    'myUnit.apartment': 'Appartement',
    'myUnit.floor': 'Étage',
    'myUnit.relation': 'Je suis',
    'myUnit.sqrm': 'Surface (m²)',
    'myUnit.paymentMethod': 'Paiement par',
    'myUnit.monthlyPayment': 'Charges mensuelles',
    'relationType.owner': 'Propriétaire',
    'relationType.tenant': 'Locataire',
    'paymentMethod.card': 'Carte bancaire',
    'paymentMethod.cash': 'Espèces',
    'paymentMethod.transfer': 'Virement bancaire',
    'paymentMethod.bit_paybox': 'Bit / PayBox',
    'settings.title': 'Paramètres du compte',
    'settings.subtitle': 'Gérez votre profil et votre compte',
    'settings.email': 'E-mail',
    'settings.emailVerified': 'E-mail vérifié',
    'settings.verified': 'Vérifié',
    'settings.notVerified': 'Non vérifié',
    'settings.backToHome': "Retour à l'accueil",
    'settings.nameLabel': 'Nom',
    'settings.languageLabel': 'Langue',
    'settings.dangerZoneTitle': 'Zone de danger',
    'settings.dangerZoneDescription':
      'La suppression de votre compte efface définitivement votre profil et vos données. Cette action est irréversible.',
    'settings.deleteAccountButton': 'Supprimer le compte',
    'settings.deleteDialogTitle': 'Supprimer votre compte ?',
    'settings.deleteDialogDescription':
      'Cela supprimera définitivement votre profil buildy et votre accès. Cette action est irréversible.',
    'settings.deleteConfirmInstruction': 'Tapez « {{phrase}} » pour confirmer.',
    'settings.deleteConfirmPlaceholder': 'Tapez {{phrase}}',
    'settings.leaveBuildingTitle': "Quitter l'immeuble",
    'settings.leaveBuildingDescription': 'On vous demandera de rejoindre un immeuble à votre prochaine connexion.',
    'settings.leaveBuildingButton': "Quitter l'immeuble",
    'settings.leaveDialogTitle': 'Quitter cet immeuble ?',
    'settings.leaveDialogDescription':
      "Vous perdrez l'accès aux problèmes et informations de cet immeuble jusqu'à ce que vous le rejoigniez à nouveau.",
    'settings.leaveConfirmInstruction': 'Tapez « {{phrase}} » pour confirmer.',
    'settings.leaveConfirmPlaceholder': 'Tapez {{phrase}}',
    'common.delete': 'Supprimer',
    'admin.sectionTitle': 'Administration',
    'admin.sectionDescription': 'Créer, modifier et supprimer des immeubles et leurs messages.',
    'admin.openPanel': "Ouvrir le panneau d'administration",
    'admin.subtitle': 'Tout ce que vous pouvez gérer en tant qu’administrateur buildy.',
    'admin.newBuilding': 'Nouvel immeuble',
    'admin.stats': '{{members}} résidents · {{messages}} messages · {{docs}} documents',
    'admin.noBuildings': "Aucun immeuble pour l'instant.",
    'admin.editBuilding': "Modifier l'immeuble",
    'admin.deleteTitle': 'Supprimer {{name}} ?',
    'admin.deleteBody': "Cela supprime définitivement l'immeuble ainsi que les adhésions des résidents, les messages et les documents.",
    'admin.deleteConfirmInstruction': "Saisissez le nom de l'immeuble pour confirmer.",
    'admin.saveError': "Impossible d'enregistrer l'immeuble. Veuillez réessayer.",
    'admin.duplicateError': 'Un immeuble avec cette adresse existe déjà dans cette ville.',
    'admin.identityAdminOnly': 'Seul un administrateur peut modifier le nom, la ville et l’adresse',
    'admin.fieldName': 'Nom',
    'admin.fieldCity': 'Ville',
    'admin.fieldAddress': 'Adresse',
    'admin.fieldDescription': 'Description',
    'wizard.name.title': "Comment s'appelle l'immeuble ?",
    'wizard.name.subtitle': "Les résidents verront ce nom sur leur écran d'accueil.",
    'wizard.name.placeholder': 'ex. Maple Court',
    'wizard.city.title': 'Dans quelle ville se trouve-t-il ?',
    'wizard.city.subtitle': 'Commencez à taper pour chercher dans la liste officielle des villes et localités.',
    'wizard.city.placeholder': 'Rechercher une ville',
    'wizard.address.title': "Quelle est l'adresse ?",
    'wizard.address.subtitle': 'Rue et numéro.',
    'wizard.address.placeholder': 'ex. 14 rue Ben Yehuda',
    'wizard.details.title': 'Quelques détails',
    'wizard.details.subtitle': 'Facultatif — vous pourrez compléter plus tard.',
    'wizard.review.title': 'Prêt à créer ?',
    'wizard.review.subtitle': 'Vérifiez les informations ci-dessous.',
    'wizard.review.create': "Créer l'immeuble",
    'wizard.done': 'Immeuble créé',
    'role.committee_head': 'Président du conseil',
    'role.resident': 'Résident',
    'members.title': 'Résidents',
    'members.residents': 'Résidents',
    'members.count': '{{count}} résidents',
    'members.unnamed': 'Résident sans nom',
    'members.apartment': 'Appt {{apartment}}',
    'members.floor': 'Étage {{floor}}',
    'members.viewAll': 'Voir tout',
    'members.you': 'Vous',
    'members.remove': "Retirer de l'immeuble",
    'members.removeConfirm': "Retirer {{name}} de l'immeuble ?",
    'members.roleLabel': 'Rôle',
    'members.empty': "Aucun résident pour l'instant.",
    'members.actionError': 'Impossible de mettre à jour le résident. Veuillez réessayer.',
    'docs.title': 'Documents',
    'docs.upload': 'Téléverser',
    'docs.uploadTitle': 'Téléverser un document',
    'docs.chooseFile': 'Choisir un fichier',
    'docs.fileHint': 'PDF, Word, Excel, PowerPoint, images ou texte · 10 Mo max.',
    'docs.titleLabel': 'Titre (facultatif)',
    'docs.empty': "Aucun document pour l'instant.",
    'docs.uploadError': 'Impossible de téléverser le fichier. Veuillez réessayer.',
    'docs.tooLarge': 'Le fichier dépasse 10 Mo.',
    'docs.badType': "Ce type de fichier n'est pas pris en charge.",
    'docs.renameTitle': 'Renommer le document',
    'docs.deleteTitle': 'Supprimer ce document ?',
    'docs.deleteBody': "Il sera retiré pour tous les résidents de l'immeuble.",
    'docs.actionError': 'Impossible de mettre à jour le document. Veuillez réessayer.',
    'docs.downloadError': "Impossible d'ouvrir le fichier.",
    'dashboard.uploadDocument': 'Téléverser un document',
    'dashboard.viewMembers': "Résidents de l'immeuble",
    'dashboard.noContacts': "Aucun lien de contact pour l'instant.",
    'admin.contactsTitle': 'Liens de contact',
    'admin.addContact': 'Ajouter',
    'admin.contactLinkLabel': 'Lien, numéro ou e-mail',
    'admin.contactError': 'Vérifiez le lien : WhatsApp exige un lien https://, le téléphone un numéro, l’e-mail une adresse.',
    'wizard.contacts.title': 'Comment les résidents peuvent-ils joindre le conseil ?',
    'wizard.contacts.subtitle': 'Ajoutez un groupe WhatsApp, un téléphone ou un e-mail. Vous pourrez en ajouter plus tard.',
    'settings.profileTitle': 'Profil',
    'settings.editProfile': 'Modifier le profil',
    'settings.preferencesTitle': "Préférences de l'application",
    'settings.preferencesSubtitle': 'Enregistrées sur cet appareil.',
    'settings.themeLabel': 'Apparence',
    'settings.accountTitle': 'Compte',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Système',
    'userMenu.profile': 'Modifier le profil',
    'userMenu.preferences': "Préférences de l'application",
    'adminFab.viewAs': 'Voir en tant que',
    'adminFab.viewAsHint': 'Prévisualiser buildy avec l’un de ces rôles',
    'adminFab.roleAdmin': 'Administrateur (accès complet)',
    'dashboard.viewingAs': "Vous voyez buildy en tant que {{role}} — les outils d'administration sont masqués.",
    'dashboard.switchBackToAdmin': 'Revenir en mode administrateur',
    'docs.noPreview': "Pas d'aperçu pour ce type de fichier — téléchargez-le pour l'ouvrir.",
    'docs.download': 'Télécharger',
    'docs.fullscreen': 'Plein écran',
    'docs.exitFullscreen': 'Quitter le plein écran',
    'docs.close': 'Fermer',
    'adminFab.tooltip': "Outils d'administration",
    'adminFab.openConsole': "Ouvrir la console d'administration",
    'admin.consoleTitle': "Console d'administration",
    'admin.searchBuildings': 'Rechercher un immeuble',
    'admin.selectBuilding': 'Immeuble',
    'admin.noMatches': 'Aucun immeuble ne correspond.',
    'admin.backToApp': "Retour à l'application",
    'admin.tabOverview': 'Aperçu',
    'admin.tabMembers': 'Résidents',
    'admin.tabDocuments': 'Documents',
    'role.management_company': 'Société de gestion',
    'members.management': "Gestion de l'immeuble",
    'common.formerResident': 'Ancien résident',
    'dashboard.editDetails': 'Modifier les détails',
    'layout.sectionTitle': "Disposition de l'accueil",
    'layout.editToggle': "Modifier la disposition de l'accueil",
    'layout.editToggleHint': "Une fois activé, survolez une tuile de l'accueil pour la déplacer ou la redimensionner.",
    'layout.reset': 'Réinitialiser la disposition',
    'layout.resetDone': 'Disposition réinitialisée',
    'layout.done': 'Terminé',
    'layout.editingHint': 'Modification de la disposition — déplacez une tuile par sa poignée, redimensionnez-la par le coin.',
    'layout.dragHandle': 'Glisser pour déplacer',
    'members.manage': 'Gérer',
    'members.manageTitle': 'Gérer {{name}}',
    'members.apartmentsTitle': 'Appartements',
    'members.addApartment': 'Ajouter un appartement',
    'members.block': 'Bloquer',
    'members.blockConfirm': 'Bloquer {{name}} ?',
    'members.blockHint': "Cette personne sera retirée et ne pourra pas revenir avant d'être débloquée.",
    'members.blockedTitle': 'Bloqués',
    'members.blockedBy': 'Bloqué par {{name}}',
    'members.unblock': 'Débloquer',
    'myUnit.setByManagement': "Les appartements et les détails de paiement sont définis par la gestion de l'immeuble.",
    'settings.phoneLabel': 'Téléphone',
    'settings.phoneHint': "Facultatif. Seuls la gestion de l'immeuble et les administrateurs le voient.",
    'settings.phoneInvalid': 'Ce numéro de téléphone semble incorrect.',
    'settings.saveError': "Impossible d'enregistrer. Veuillez réessayer.",
    'settings.pictureTooLarge': "L'image dépasse 2 Mo.",
    'settings.pictureError': 'Impossible de mettre à jour votre photo. Veuillez réessayer.',
    'settings.deleteKeepsContent': "Les messages et documents que vous avez publiés restent dans l'immeuble, affichés comme « Ancien résident ».",
    'picture.add': 'Ajouter une photo de profil',
    'picture.edit': 'Modifier la photo de profil',
    'picture.upload': 'Téléverser un fichier',
    'picture.remove': 'Supprimer la photo',
    'picture.cropTitle': 'Ajustez votre photo',
    'picture.cropHint': 'Faites glisser pour déplacer, utilisez le curseur pour zoomer. Le cercle est ce que les autres verront.',
    'picture.zoom': 'Zoom',
    'picture.notImage': 'Veuillez choisir un fichier image.',
    'picture.pendingUpload': 'Nouvelle photo prête — appuyez sur Enregistrer pour la garder.',
    'picture.pendingRemove': 'La photo sera supprimée quand vous appuierez sur Enregistrer.',
    'userMenu.emailVerified': 'E-mail vérifié',
    'userMenu.signOut': 'Se déconnecter',
  },
  es: {
    'common.continue': 'Continuar',
    'common.finish': 'Finalizar',
    'common.getStarted': 'Comenzar',
    'common.welcomeToBuildy': 'Bienvenido a buildy',
    'common.edit': 'Editar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'language.title': 'Elige tu idioma',
    'language.subtitle': 'Puedes cambiarlo más tarde en la configuración.',
    'language.confirm': 'Idioma guardado',
    'name.title': '¿Cómo debemos llamarte?',
    'name.subtitle': 'Así es como te verán tus vecinos.',
    'name.placeholder': 'Tu nombre completo',
    'name.confirm': 'Encantado de conocerte, {{name}}',
    'home.title': 'buildy',
    'home.tagline': 'Todo sobre tu edificio, en un solo lugar',
    'home.signInPrompt': 'Inicia sesión para ver documentos, finanzas y avisos del edificio',
    'home.signInButton': 'Iniciar sesión con Google',
    'dashboard.welcome': 'Bienvenido de nuevo, {{name}}',
    'nav.home': 'Inicio',
    'nav.issues': 'Incidencias',
    'nav.money': 'Dinero',
    'nav.docs': 'Documentos',
    'nav.people': 'Vecinos',
    'nav.label': 'Secciones',
    'language.partial': 'traducción parcial',
    'payments.slideToPay': 'Desliza para pagar ₪{{amount}}',
    'payments.sending': 'Enviando…',
    'payments.paidThanks': 'Pagado, gracias',
    'door.hold': 'Mantén pulsado para ver',
    'door.tapToCopy': 'Toca el código para copiarlo',
    'door.copied': 'Copiado',
    'greeting.morning': 'Buenos días, {{name}}',
    'greeting.afternoon': 'Buenas tardes, {{name}}',
    'greeting.evening': 'Buenas noches, {{name}}',
    'greeting.night': 'Buenas noches, {{name}}',
    'dashboard.quickActions': 'Acciones rápidas',
    'dashboard.reportIssue': 'Reportar un problema',
    'dashboard.building': 'Edificio',
    'dashboard.filterAll': 'Todos',
    'dashboard.entryCode': 'Código de entrada',
    'dashboard.memberCount': '{{count}} residentes en buildy',
    'dashboard.contacts': 'Contactar con el edificio',
    'contactType.whatsapp': 'Grupo de WhatsApp',
    'contactType.phone': 'Teléfono',
    'contactType.email': 'Correo electrónico',
    'myUnit.title': 'Mis apartamentos',
    'myUnit.empty': 'La administración del edificio aún no te ha asignado un apartamento.',
    'myUnit.apartment': 'Apartamento',
    'myUnit.floor': 'Planta',
    'myUnit.relation': 'Soy',
    'myUnit.sqrm': 'Superficie (m²)',
    'myUnit.paymentMethod': 'Pago por',
    'myUnit.monthlyPayment': 'Cuota mensual',
    'relationType.owner': 'Propietario',
    'relationType.tenant': 'Inquilino',
    'paymentMethod.card': 'Tarjeta de crédito',
    'paymentMethod.cash': 'Efectivo',
    'paymentMethod.transfer': 'Transferencia bancaria',
    'paymentMethod.bit_paybox': 'Bit / PayBox',
    'settings.title': 'Configuración de la cuenta',
    'settings.subtitle': 'Administra tu perfil y tu cuenta',
    'settings.email': 'Correo electrónico',
    'settings.emailVerified': 'Correo verificado',
    'settings.verified': 'Verificado',
    'settings.notVerified': 'No verificado',
    'settings.backToHome': 'Volver al inicio',
    'settings.nameLabel': 'Nombre',
    'settings.languageLabel': 'Idioma',
    'settings.dangerZoneTitle': 'Zona de peligro',
    'settings.dangerZoneDescription':
      'Eliminar tu cuenta borra permanentemente tu perfil y tus datos. Esta acción no se puede deshacer.',
    'settings.deleteAccountButton': 'Eliminar cuenta',
    'settings.deleteDialogTitle': '¿Eliminar tu cuenta?',
    'settings.deleteDialogDescription':
      'Esto eliminará permanentemente tu perfil de buildy y tu acceso. Esta acción no se puede deshacer.',
    'settings.deleteConfirmInstruction': 'Escribe "{{phrase}}" para confirmar.',
    'settings.deleteConfirmPlaceholder': 'Escribe {{phrase}}',
    'settings.leaveBuildingTitle': 'Salir del edificio',
    'settings.leaveBuildingDescription': 'Se te pedirá unirte a un edificio de nuevo la próxima vez que inicies sesión.',
    'settings.leaveBuildingButton': 'Salir del edificio',
    'settings.leaveDialogTitle': '¿Salir de este edificio?',
    'settings.leaveDialogDescription':
      'Perderás el acceso a las incidencias e información de este edificio hasta que vuelvas a unirte.',
    'settings.leaveConfirmInstruction': 'Escribe "{{phrase}}" para confirmar.',
    'settings.leaveConfirmPlaceholder': 'Escribe {{phrase}}',
    'common.delete': 'Eliminar',
    'admin.sectionTitle': 'Administración',
    'admin.sectionDescription': 'Crea, edita y elimina edificios y sus mensajes.',
    'admin.openPanel': 'Abrir panel de administración',
    'admin.subtitle': 'Todo lo que puedes gestionar como administrador de buildy.',
    'admin.newBuilding': 'Nuevo edificio',
    'admin.stats': '{{members}} residentes · {{messages}} mensajes · {{docs}} documentos',
    'admin.noBuildings': 'Todavía no hay edificios.',
    'admin.editBuilding': 'Editar edificio',
    'admin.deleteTitle': '¿Eliminar {{name}}?',
    'admin.deleteBody': 'Esto elimina permanentemente el edificio junto con las membresías de sus residentes, mensajes y documentos.',
    'admin.deleteConfirmInstruction': 'Escribe el nombre del edificio para confirmar.',
    'admin.saveError': 'No se pudo guardar el edificio. Inténtalo de nuevo.',
    'admin.duplicateError': 'Ya existe un edificio con esta dirección en esta ciudad.',
    'admin.identityAdminOnly': 'El nombre, la ciudad y la dirección solo los puede cambiar un administrador',
    'admin.fieldName': 'Nombre',
    'admin.fieldCity': 'Ciudad',
    'admin.fieldAddress': 'Dirección',
    'admin.fieldDescription': 'Descripción',
    'wizard.name.title': '¿Cómo se llama el edificio?',
    'wizard.name.subtitle': 'Los residentes verán este nombre en su pantalla de inicio.',
    'wizard.name.placeholder': 'p. ej. Maple Court',
    'wizard.city.title': '¿En qué ciudad está?',
    'wizard.city.subtitle': 'Empieza a escribir para buscar en la lista oficial de ciudades y localidades.',
    'wizard.city.placeholder': 'Buscar ciudad',
    'wizard.address.title': '¿Cuál es la dirección?',
    'wizard.address.subtitle': 'Calle y número.',
    'wizard.address.placeholder': 'p. ej. Ben Yehuda 14',
    'wizard.details.title': 'Algunos detalles',
    'wizard.details.subtitle': 'Opcional: puedes completarlos más tarde.',
    'wizard.review.title': '¿Listo para crear?',
    'wizard.review.subtitle': 'Revisa los datos a continuación.',
    'wizard.review.create': 'Crear edificio',
    'wizard.done': 'Edificio creado',
    'role.committee_head': 'Presidente de la comunidad',
    'role.resident': 'Residente',
    'members.title': 'Residentes',
    'members.residents': 'Residentes',
    'members.count': '{{count}} residentes',
    'members.unnamed': 'Residente sin nombre',
    'members.apartment': 'Apto. {{apartment}}',
    'members.floor': 'Planta {{floor}}',
    'members.viewAll': 'Ver todos',
    'members.you': 'Tú',
    'members.remove': 'Quitar del edificio',
    'members.removeConfirm': '¿Quitar a {{name}} del edificio?',
    'members.roleLabel': 'Rol',
    'members.empty': 'Todavía no hay residentes.',
    'members.actionError': 'No se pudo actualizar al residente. Inténtalo de nuevo.',
    'docs.title': 'Documentos',
    'docs.upload': 'Subir',
    'docs.uploadTitle': 'Subir un documento',
    'docs.chooseFile': 'Elegir archivo',
    'docs.fileHint': 'PDF, Word, Excel, PowerPoint, imágenes o texto · hasta 10 MB',
    'docs.titleLabel': 'Título (opcional)',
    'docs.empty': 'Todavía no hay documentos.',
    'docs.uploadError': 'No se pudo subir el archivo. Inténtalo de nuevo.',
    'docs.tooLarge': 'El archivo supera los 10 MB.',
    'docs.badType': 'Este tipo de archivo no es compatible.',
    'docs.renameTitle': 'Renombrar documento',
    'docs.deleteTitle': '¿Eliminar este documento?',
    'docs.deleteBody': 'Se eliminará para todos los residentes del edificio.',
    'docs.actionError': 'No se pudo actualizar el documento. Inténtalo de nuevo.',
    'docs.downloadError': 'No se pudo abrir el archivo.',
    'dashboard.uploadDocument': 'Subir un documento',
    'dashboard.viewMembers': 'Residentes del edificio',
    'dashboard.noContacts': 'Todavía no hay enlaces de contacto.',
    'admin.contactsTitle': 'Enlaces de contacto',
    'admin.addContact': 'Añadir',
    'admin.contactLinkLabel': 'Enlace, número o correo',
    'admin.contactError': 'Revisa el enlace: WhatsApp necesita un enlace https://, el teléfono un número y el correo una dirección.',
    'wizard.contacts.title': '¿Cómo pueden los residentes contactar con la junta?',
    'wizard.contacts.subtitle': 'Añade un grupo de WhatsApp, un teléfono o un correo. Puedes añadir más después.',
    'settings.profileTitle': 'Perfil',
    'settings.editProfile': 'Editar perfil',
    'settings.preferencesTitle': 'Preferencias de la app',
    'settings.preferencesSubtitle': 'Se guardan en este dispositivo.',
    'settings.themeLabel': 'Apariencia',
    'settings.accountTitle': 'Cuenta',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'theme.system': 'Sistema',
    'userMenu.profile': 'Editar perfil',
    'userMenu.preferences': 'Preferencias de la app',
    'adminFab.viewAs': 'Ver como',
    'adminFab.viewAsHint': 'Previsualizar buildy con uno de estos roles',
    'adminFab.roleAdmin': 'Administrador (acceso completo)',
    'dashboard.viewingAs': 'Estás viendo buildy como {{role}}: las herramientas de administración están ocultas.',
    'dashboard.switchBackToAdmin': 'Volver al modo administrador',
    'docs.noPreview': 'No hay vista previa para este tipo de archivo: descárgalo para abrirlo.',
    'docs.download': 'Descargar',
    'docs.fullscreen': 'Pantalla completa',
    'docs.exitFullscreen': 'Salir de pantalla completa',
    'docs.close': 'Cerrar',
    'adminFab.tooltip': 'Herramientas de administración',
    'adminFab.openConsole': 'Abrir la consola de administración',
    'admin.consoleTitle': 'Consola de administración',
    'admin.searchBuildings': 'Buscar edificios',
    'admin.selectBuilding': 'Edificio',
    'admin.noMatches': 'Ningún edificio coincide.',
    'admin.backToApp': 'Volver a la app',
    'admin.tabOverview': 'Resumen',
    'admin.tabMembers': 'Residentes',
    'admin.tabDocuments': 'Documentos',
    'role.management_company': 'Empresa administradora',
    'members.management': 'Administración del edificio',
    'common.formerResident': 'Exresidente',
    'dashboard.editDetails': 'Editar detalles',
    'layout.sectionTitle': 'Diseño de inicio',
    'layout.editToggle': 'Editar el diseño de inicio',
    'layout.editToggleHint': 'Si está activado, pasa el cursor sobre un mosaico del inicio para moverlo o cambiar su tamaño.',
    'layout.reset': 'Restablecer diseño',
    'layout.resetDone': 'Diseño restablecido',
    'layout.done': 'Listo',
    'layout.editingHint': 'Editando el diseño: arrastra un mosaico por su asa y cambia su tamaño desde la esquina.',
    'layout.dragHandle': 'Arrastra para mover',
    'members.manage': 'Gestionar',
    'members.manageTitle': 'Gestionar a {{name}}',
    'members.apartmentsTitle': 'Apartamentos',
    'members.addApartment': 'Añadir apartamento',
    'members.block': 'Bloquear',
    'members.blockConfirm': '¿Bloquear a {{name}}?',
    'members.blockHint': 'Se le quitará del edificio y no podrá volver hasta que se le desbloquee.',
    'members.blockedTitle': 'Bloqueados',
    'members.blockedBy': 'Bloqueado por {{name}}',
    'members.unblock': 'Desbloquear',
    'myUnit.setByManagement': 'La administración del edificio define los apartamentos y los datos de pago.',
    'settings.phoneLabel': 'Teléfono',
    'settings.phoneHint': 'Opcional. Solo lo ven la administración del edificio y los administradores.',
    'settings.phoneInvalid': 'Ese número de teléfono no parece correcto.',
    'settings.saveError': 'No se pudo guardar. Inténtalo de nuevo.',
    'settings.pictureTooLarge': 'La imagen supera los 2 MB.',
    'settings.pictureError': 'No se pudo actualizar tu foto. Inténtalo de nuevo.',
    'settings.deleteKeepsContent': "Los mensajes y documentos que publicaste se quedan en el edificio, como 'Exresidente'.",
    'picture.add': 'Añadir foto de perfil',
    'picture.edit': 'Editar foto de perfil',
    'picture.upload': 'Subir archivo',
    'picture.remove': 'Quitar foto',
    'picture.cropTitle': 'Ajusta tu foto',
    'picture.cropHint': 'Arrastra para mover y usa el control para hacer zoom. El círculo es lo que verán los demás.',
    'picture.zoom': 'Zoom',
    'picture.notImage': 'Elige un archivo de imagen.',
    'picture.pendingUpload': 'Nueva foto lista: pulsa Guardar para conservarla.',
    'picture.pendingRemove': 'La foto se quitará cuando pulses Guardar.',
    'userMenu.emailVerified': 'Correo verificado',
    'userMenu.signOut': 'Cerrar sesión',
  },
};
