```
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a nice font if possible, otherwise use Helvetica
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf'
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    paddingBottom: 60,
  },
  headerStrip: {
    height: 8,
    backgroundColor: '#06B6D4', // Cyan-500
    width: '100%',
  },
  header: {
    padding: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 'auto',
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  headerMetaText: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  content: {
    paddingHorizontal: 40,
  },
  titleSection: {
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  checkId: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    fontFamily: 'Courier',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    border: '1px solid #E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  statBoxLast: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 0,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  statValueBig: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  detailsGrid: {
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    width: 200,
    fontSize: 11,
    color: '#475569',
    fontWeight: 'bold',
  },
  detailValue: {
    flex: 1,
    fontSize: 11,
    color: '#0F172A',
  },
  recCard: {
    marginBottom: 12,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginRight: 6,
  },
  recCategory: {
    fontSize: 8,
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recDesc: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

interface ComplianceReportPDFProps {
  check: any;
  user: any;
  logoBase64?: string;
}

export const ComplianceReportPDF = ({ check, user, logoBase64 }: ComplianceReportPDFProps) => {
  const formattedDate = new Date(check.createdAt).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return '#EF4444'; // Red
      case 'UNACCEPTABLE': return '#BE123C'; // Rose
      case 'LIMITED': return '#F59E0B'; // Amber
      default: return '#10B981'; // Emerald
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
        case 'MINIMAL': return 'Minimal';
        case 'LIMITED': return 'Begrenzt';
        case 'HIGH': return 'Hoch';
        case 'UNACCEPTABLE': return 'Unzulässig';
        default: return level;
    }
  };

  const recommendations = Array.isArray(check.recommendations) ? check.recommendations : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerStrip} />
        
        {/* Header */}
        <View style={styles.header}>
            {logoBase64 ? (
                <Image src={logoBase64} style={styles.logo} />
            ) : (
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#06B6D4' }}>CompliAI</Text>
            )}
            <View style={styles.headerMeta}>
                <Text style={styles.headerMetaText}>Compliance Report</Text>
                <Text style={styles.headerMetaText}>{formattedDate}</Text>
            </View>
        </View>

        <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>EU AI Act Compliance Check</Text>
                <Text style={styles.subtitle}>Erstellt für {user.name || user.email}</Text>
                <Text style={styles.checkId}>Check ID: {check.id}</Text>
            </View>

            {/* Key Stats Card */}
            <View style={styles.statsCard}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>GESAMT-SCORE</Text>
                    <Text style={{ ...styles.statValueBig, color: check.overallScore >= 80 ? '#10B981' : check.overallScore >= 60 ? '#F59E0B' : '#EF4444' }}>
                        {check.overallScore}/100
                    </Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>RISIKOSTUFE</Text>
                    <Text style={{ ...styles.statValueBig, color: getRiskColor(check.riskLevel) }}>
                        {getRiskLabel(check.riskLevel)}
                    </Text>
                </View>
                <View style={styles.statBoxLast}>
                    <Text style={styles.statLabel}>STATUS</Text>
                    <Text style={{ ...styles.statValueBig, color: '#0F172A' }}>
                        {check.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Bearbeitung'}
                    </Text>
                </View>
            </View>

            {/* Scores Breakdown */}
            <View style={styles.detailsGrid}>
                <Text style={styles.sectionTitle}>Detailbewertung</Text>
                <View style={styles.detailRow}>
                    <Text style={{ ...styles.detailLabel, color: '#64748B' }}>Technische Robustheit:</Text>
                    <Text style={styles.detailValue}>{check.technicalScore}/100</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={{ ...styles.detailLabel, color: '#64748B' }}>Dokumentation:</Text>
                    <Text style={styles.detailValue}>{check.documentationScore}/100</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={{ ...styles.detailLabel, color: '#64748B' }}>Governance:</Text>
                    <Text style={styles.detailValue}>{check.governanceScore}/100</Text>
                </View>
            </View>

            {/* Recommendations */}
            <View>
                <Text style={styles.sectionTitle}>Handlungsempfehlungen</Text>
                {recommendations.length > 0 ? (
                    recommendations.map((rec: any, index: number) => (
                        <View key={index} style={{ 
                            ...styles.recCard, 
                            borderLeftColor: rec.priority === 'HIGH' ? '#EF4444' : rec.priority === 'MEDIUM' ? '#F59E0B' : '#3B82F6' 
                        }}>
                            <View style={styles.recHeader}>
                                <Text style={styles.recTitle}>{rec.title}</Text>
                                <Text style={styles.recCategory}>({rec.category})</Text>
                            </View>
                            <Text style={styles.recDesc}>{rec.description}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic', padding: 10 }}>
                        Keine spezifischen Empfehlungen gefunden. Ihr System scheint gut aufgestellt zu sein!
                    </Text>
                )}
            </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Generiert von CompliAI - Ihr Assistent für EU AI Act Compliance. 
                Dieses Dokument dient als Orientierungshilfe und ersetzt keine rechtliche Beratung.
            </Text>
        </View>
      </Page>
    </Document>
  );
};
```
