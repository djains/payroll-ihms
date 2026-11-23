import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import { AppScreenContainer, AppHeader, AppIcon } from '../../components/common';
import { useNavigation } from '../../navigation';
import { ms } from '../../theme/responsive';

interface TermSection {
  id: number;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
}

const TERMS_DATA: TermSection[] = [
  {
    id: 1,
    title: 'Acceptance of Terms',
    paragraphs: [
      'By installing, logging in to or using the App, you confirm that you have read, understood and agreed to these Terms and our Privacy Policy. If you do not agree, please do not use the App. These Terms are an electronic record under the Information Technology Act, 2000 and do not require a physical or digital signature.',
    ],
  },
  {
    id: 2,
    title: 'Definitions',
    bullets: [
      '“Employer” means the organisation that engages you and has enabled NG Global services for its workforce.',
      '“User” or “you” means any employee, contract worker, supervisor or authorised staff member who uses the App.',
      '“Account” means the login credentials and profile created for you to access the App.',
      '“Services” means the attendance, location verification, leave, overtime, payroll, salary slip and related features available in the App.',
    ],
  },
  {
    id: 3,
    title: 'Eligibility',
    paragraphs: [
      'The App is intended only for persons aged 18 years or above who are employed or engaged by an Employer that uses NG Global services. You must be authorised by your Employer to use the App.',
    ],
  },
  {
    id: 4,
    title: 'Your Account',
    bullets: [
      'Accounts are created and managed by your Employer or its authorised administrators. You cannot create an account on your own.',
      'You must keep your login credentials, one-time passwords and device confidential and must not share them with anyone.',
      'You are responsible for all activity carried out through your Account. Please inform your Employer or us immediately if you suspect unauthorised use.',
      'The App may be linked to a registered device. Using the App on an unregistered device may require approval from your Employer.',
      'You must provide accurate and up-to-date information and ensure that documents you upload are genuine.',
    ],
  },
  {
    id: 5,
    title: 'The Services',
    paragraphs: ['Depending on how your Employer has configured the App, the Services may include:'],
    bullets: [
      'Punch-in and punch-out with GPS location and live selfie verification',
      'Shift, working hours, overtime and attendance history',
      'Leave requests and approvals',
      'Salary slips, payroll and tax-related documents',
      'Location tracking during duty hours for field staff and supervisors, where enabled by the Employer',
      'Notifications and communication from your Employer',
    ],
    note: 'Features and access levels differ from one Employer and role to another. Your Employer decides which features are enabled for you.',
  },
  {
    id: 6,
    title: 'Permissions and Consent',
    paragraphs: [
      'To use the attendance features, the App needs access to your device’s location and camera, and to documents you choose to upload or download. Location may also be collected in the background during active duty hours if your Employer has enabled this for your role.',
      'You can change these permissions at any time in your device settings, but if you disable them, you may not be able to mark attendance or use related features. How we handle your data is explained in our Privacy Policy.',
    ],
  },
  {
    id: 7,
    title: 'Acceptable Use',
    paragraphs: ['You agree that you will use the App honestly and only for lawful, work-related purposes. You must not:'],
    bullets: [
      'Mark attendance for another person, or allow another person to mark attendance for you',
      'Use fake or mock GPS locations, location-spoofing apps, emulators, rooted-device tricks or any method to give a false location',
      'Submit selfies or photographs that are of another person, edited, pre-recorded or taken from a screen or a printed photograph',
      'Provide false, misleading or forged information or documents',
      'Access or attempt to access another user’s account, data or any part of the App for which you are not authorised',
      'Copy, modify, reverse engineer, decompile or attempt to extract the source code of the App, except as allowed by law',
      'Interfere with, overload, scan for vulnerabilities in or disrupt the App, its servers or networks',
      'Introduce malware or any harmful code',
      'Use the App to harass, threaten or harm anyone, or for any unlawful purpose',
      'Use automated tools, bots or scripts to access the App',
    ],
    note: 'Any such misuse may be reported to your Employer and may lead to disciplinary action by your Employer, suspension of your Account and, where required, legal action.',
  },
  {
    id: 8,
    title: 'Relationship with Your Employer',
    bullets: [
      'NG Global provides the App as a technology service. NG Global is not your employer and is not a party to your employment or engagement contract.',
      'Matters such as your attendance policy, shifts, leave, overtime, salary, deductions, tax, benefits, disciplinary action and termination are decided by your Employer under your employment terms and applicable law.',
      'Your Employer’s authorised HR personnel, supervisors, administrators and payroll managers can view and manage your data in the App according to their permissions.',
      'Any dispute about pay, attendance records or employment should be raised with your Employer first.',
    ],
  },
  {
    id: 9,
    title: 'Accuracy of Attendance & Payroll Information',
    paragraphs: [
      'Attendance, working hours and payroll figures shown in the App are generated from data entered or approved by you, your supervisor and your Employer, and from device inputs such as time and GPS. They may be affected by device settings, network connectivity, GPS accuracy and configuration by your Employer.',
      'If you notice an error, please inform your Employer’s HR or payroll team so that it can be corrected. Salary slips and payroll documents in the App are provided for your convenience, and your Employer’s official records prevail.',
    ],
  },
  {
    id: 10,
    title: 'Privacy and Data Protection',
    paragraphs: [
      'Your personal data is processed in accordance with our Privacy Policy and the Digital Personal Data Protection Act, 2023. The Privacy Policy forms part of these Terms. You can exercise your data rights, including access, correction, erasure, grievance redressal, nomination and withdrawal of consent, as described in the Privacy Policy.',
    ],
  },
  {
    id: 11,
    title: 'Intellectual Property',
    paragraphs: [
      'The App, including its software, design, text, graphics, logos and all related intellectual property rights, belongs to NG Global or its licensors. We grant you a limited, personal, non-exclusive, non-transferable and revocable licence to install and use the App on your device solely for work-related purposes during the period you are authorised by your Employer.',
      'No other rights are granted to you. Data entered by you or your Employer remains the property of its respective owner, and you allow us to process it only to provide the Services.',
    ],
  },
  {
    id: 12,
    title: 'Availability and Updates',
    paragraphs: [
      'We try to keep the App available and secure, but we do not guarantee that it will always be uninterrupted, error-free or free from delays. The App may be unavailable from time to time because of maintenance, updates, network problems, device issues or reasons beyond our control.',
      'We may update, modify or discontinue features, and you may need to install updates to continue using the App. If the App is unavailable, please follow your Employer’s alternate attendance procedure.',
    ],
  },
  {
    id: 13,
    title: 'Suspension and Termination',
    paragraphs: ['Your access to the App may be suspended or ended:'],
    bullets: [
      'When your employment or engagement with the Employer ends, or the Employer asks us to deactivate your Account',
      'If you violate these Terms or misuse the App',
      'If required by law or to protect the security of the App, other users or the Employer',
      'If the Employer’s agreement with NG Global ends',
    ],
    note: 'After termination, your right to use the App ends immediately. Data may continue to be retained for the periods described in the Privacy Policy and as required by law.',
  },
  {
    id: 14,
    title: 'Disclaimer of Warranties',
    paragraphs: [
      'To the extent permitted by law, the App and the Services are provided on an “as is” and “as available” basis. We do not make any warranty, express or implied, about the accuracy of location or time data, uninterrupted operation, or suitability for a particular purpose, other than those that cannot be excluded under applicable law.',
    ],
  },
  {
    id: 15,
    title: 'Limitation of Liability',
    paragraphs: [
      'To the extent permitted by law, NG Global will not be liable for any indirect, incidental, special or consequential loss, or for loss of wages, profit, data or opportunity arising out of your use of, or inability to use, the App, including losses caused by GPS or network errors, device faults, incorrect data entered by you or your Employer, or decisions taken by your Employer.',
      'Nothing in these Terms limits any liability that cannot be limited under applicable law, or any right you have under data protection laws.',
    ],
  },
  {
    id: 16,
    title: 'Indemnity',
    paragraphs: [
      'You agree to be responsible for any loss or claim that arises from your deliberate misuse of the App or your breach of these Terms, including submission of false attendance, location or documents, to the extent permitted by law.',
    ],
  },
  {
    id: 17,
    title: 'Governing Law and Disputes',
    paragraphs: [
      'These Terms are governed by the laws of India. We encourage you to first raise any concern with your Employer or with us through the contact details below so that it can be resolved amicably. If a dispute is not resolved, it will be subject to the jurisdiction of the competent courts in India, subject to any rights you have under applicable consumer, labour or data protection laws.',
    ],
  },
  {
    id: 18,
    title: 'Contact and Grievances',
    paragraphs: ['For questions about these Terms, or for any grievance, you can contact us in either of these ways:'],
    bullets: [
      'Through your Employer: Your Employer’s authorised HR or administrative team, who will act on the matter or escalate it to NG Global where needed.',
      'Directly with NG Global: Using developer email (support@ngglobal.in) with your employee code and registered mobile number.',
    ],
    note: 'Privacy-related requests and complaints will be handled as described in the Privacy Policy.',
  },
  {
    id: 19,
    title: 'Changes to These Terms',
    paragraphs: [
      'We may update these Terms from time to time to reflect changes in the App, our Services or applicable law. The latest version will be available on our official Terms and Conditions page with the “Last Updated” date shown at the top. We may inform you of significant changes through in-app notifications or other suitable channels. Your continued use of the App after the changes take effect means that you accept the updated Terms.',
    ],
  },
  {
    id: 20,
    title: 'General',
    bullets: [
      'Severability: If any part of these Terms is found to be unenforceable, the remaining parts will continue to apply.',
      'No waiver: A delay or failure to enforce any provision is not a waiver of our rights.',
      'Entire agreement: These Terms and the Privacy Policy together make up the agreement between you and NG Global regarding use of the App.',
      'Assignment: We may transfer our rights and obligations under these Terms to a successor or affiliate. You may not transfer your rights under these Terms.',
    ],
  },
];

export const TermsAndConditionsScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({
    1: true,
    5: true,
    6: true,
    7: true,
  });

  const toggleSection = (id: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allExpanded = useMemo(() => {
    return TERMS_DATA.every((sec) => expandedIds[sec.id]);
  }, [expandedIds]);

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const all: Record<number, boolean> = {};
      TERMS_DATA.forEach((s) => {
        all[s.id] = true;
      });
      setExpandedIds(all);
    }
  };

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return TERMS_DATA;
    const q = searchQuery.toLowerCase();
    return TERMS_DATA.filter((sec) => {
      const titleMatch = sec.title.toLowerCase().includes(q);
      const paraMatch = sec.paragraphs?.some((p) => p.toLowerCase().includes(q));
      const bulletMatch = sec.bullets?.some((b) => b.toLowerCase().includes(q));
      return titleMatch || paraMatch || bulletMatch;
    });
  }, [searchQuery]);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@ngglobal.in?subject=NG%20GLOBAL%20Terms%20Inquiry');
  };

  return (
    <AppScreenContainer
      scrollable
      header={
        <AppHeader
          title="Terms & Conditions"
          subtitle="NG Global • Last Updated: Nov 20, 2026"
          onBack={goBack}
        />
      }
      contentContainerStyle={styles.screenContainer}
      edges={['top', 'bottom']}
    >
      {/* ── 1. Clean App Header Banner ── */}
      <View style={styles.topCard}>
        <View style={styles.badgeRow}>
          <View style={styles.officialBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.officialBadgeText}>Official App Policy</Text>
          </View>
          <Text style={styles.packageTag}>com.ngglobal</Text>
        </View>

        <Text style={styles.appTitleText}>NG Global Terms of Service</Text>
        <Text style={styles.appSummaryText}>
          These Terms govern your use of the NG Global workforce management, attendance verification, and payroll
          application. Electronic agreement under the Information Technology Act, 2000.
        </Text>
      </View>

      {/* ── 2. Simple Search & Expand-All Bar ── */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBar}>
          <AppIcon name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in terms (e.g. GPS, leave, account)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="close" size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.toggleAllBtn} onPress={toggleAll} activeOpacity={0.7}>
          <Text style={styles.toggleAllText}>{allExpanded ? 'Collapse All' : 'Expand All'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 3. Simple & Clean Terms Accordion Cards ── */}
      <View style={styles.listContainer}>
        {filteredTerms.map((sec) => {
          const isExpanded = Boolean(expandedIds[sec.id]);

          return (
            <View key={sec.id} style={styles.termCard}>
              <TouchableOpacity
                style={styles.termHeader}
                activeOpacity={0.7}
                onPress={() => toggleSection(sec.id)}
              >
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{sec.id < 10 ? `0${sec.id}` : sec.id}</Text>
                </View>

                <Text style={styles.termTitleText} numberOfLines={2}>
                  {sec.title}
                </Text>

                <View style={styles.chevronWrap}>
                  <AppIcon
                    name={isExpanded ? 'chevronUp' : 'chevronDown'}
                    size={16}
                    color="#64748B"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.termBody}>
                  {sec.paragraphs?.map((p, idx) => (
                    <Text key={idx} style={styles.bodyParagraph}>
                      {p}
                    </Text>
                  ))}

                  {sec.bullets && (
                    <View style={styles.bulletsWrap}>
                      {sec.bullets.map((b, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.bulletText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {sec.note && (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{sec.note}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {filteredTerms.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No matching terms found for "{searchQuery}"</Text>
          </View>
        )}
      </View>

      {/* ── 4. Quick Support Card ── */}
      <View style={styles.supportCard}>
        <View style={styles.supportHeaderRow}>
          <View style={styles.supportIconCircle}>
            <AppIcon name="mail" size={16} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Questions or Grievances?</Text>
            <Text style={styles.supportSub}>
              Contact your Employer HR team or reach us at support@ngglobal.in
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.emailBtn} activeOpacity={0.8} onPress={handleEmailSupport}>
          <AppIcon name="mail" size={14} color="#0F766E" />
          <Text style={styles.emailBtnText}>Email Support</Text>
        </TouchableOpacity>
      </View>

      {/* ── 5. Bottom Primary Accept Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85} onPress={goBack}>
          <AppIcon name="check" size={18} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>I Understand & Accept</Text>
        </TouchableOpacity>
        <Text style={styles.bottomNote}>
          By continuing to use NG Global, you agree to these Terms and Privacy Policy.
        </Text>
      </View>
    </AppScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: ms(16),
    paddingBottom: ms(40),
    backgroundColor: '#F8FAFC',
  },

  // 1. Top Card
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(14),
    padding: ms(16),
    marginTop: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  badgeDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: '#0D9488',
    marginRight: ms(6),
  },
  officialBadgeText: {
    fontSize: ms(11),
    fontWeight: '600',
    color: '#0F766E',
  },
  packageTag: {
    fontSize: ms(11),
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  appTitleText: {
    fontSize: ms(17),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: ms(4),
  },
  appSummaryText: {
    fontSize: ms(13),
    color: '#475569',
    lineHeight: ms(19),
  },

  // 2. Search & Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(12),
    marginBottom: ms(10),
    gap: ms(8),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(10),
    paddingHorizontal: ms(10),
    height: ms(40),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(12),
    color: '#0F172A',
    marginLeft: ms(8),
    paddingVertical: 0,
  },
  toggleAllBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(12),
    height: ms(40),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleAllText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#475569',
  },

  // 3. Terms Cards List
  listContainer: {
    gap: ms(8),
  },
  termCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(14),
  },
  numberBadge: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ms(10),
  },
  numberText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#0F766E',
  },
  termTitleText: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: ms(19),
  },
  chevronWrap: {
    marginLeft: ms(8),
  },
  termBody: {
    paddingHorizontal: ms(14),
    paddingBottom: ms(14),
    paddingTop: ms(2),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bodyParagraph: {
    fontSize: ms(13),
    color: '#334155',
    lineHeight: ms(20),
    marginTop: ms(8),
  },
  bulletsWrap: {
    marginTop: ms(8),
    gap: ms(6),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: ms(13),
    color: '#0D9488',
    marginRight: ms(8),
    lineHeight: ms(19),
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: ms(13),
    color: '#334155',
    lineHeight: ms(19),
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(8),
    padding: ms(10),
    marginTop: ms(10),
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  noteText: {
    fontSize: ms(12),
    color: '#475569',
    lineHeight: ms(17),
    fontStyle: 'italic',
  },
  emptyWrap: {
    padding: ms(24),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: ms(13),
    color: '#94A3B8',
  },

  // 4. Support Card
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(14),
    marginTop: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginBottom: ms(10),
  },
  supportIconCircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#0F172A',
  },
  supportSub: {
    fontSize: ms(12),
    color: '#64748B',
    marginTop: ms(2),
    lineHeight: ms(16),
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: ms(8),
    paddingVertical: ms(8),
    gap: ms(6),
  },
  emailBtnText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#0F766E',
  },

  // 5. Bottom Accept Button
  bottomBar: {
    marginTop: ms(16),
    alignItems: 'center',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    borderRadius: ms(10),
    paddingVertical: ms(13),
    width: '100%',
    gap: ms(8),
    elevation: 2,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acceptButtonText: {
    fontSize: ms(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomNote: {
    fontSize: ms(11),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: ms(8),
    lineHeight: ms(15),
  },
});
