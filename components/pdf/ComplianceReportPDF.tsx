import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed, but standard fonts are fine for now.
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 20,
    },
    logo: {
        width: 120,
        height: 'auto',
    },
    headerText: {
        fontSize: 10,
        color: '#64748B',
    },
    titleSection: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 8,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 150,
        fontSize: 10,
        color: '#64748B',
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
        fontSize: 10,
        color: '#0F172A',
    },
    recommendation: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
        borderLeftWidth: 3,
    },
    recTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    recDesc: {
        fontSize: 10,
        color: '#334155',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
    },
});

interface ComplianceReportPDFProps {
    check: any; // Using any for simplicity with Prisma types, but ideally typed
    user: any;
}

export const ComplianceReportPDF = ({ check, user }: ComplianceReportPDFProps) => {
    const formattedDate = new Date(check.createdAt).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'HIGH': return '#EF4444';
            case 'UNACCEPTABLE': return '#BE123C';
            case 'LIMITED': return '#F59E0B';
            default: return '#10B981';
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
                {/* Header */}
                <View style={styles.header}>
                    {/* Assuming the image is accessible via public URL or base64. 
                For server-side rendering, absolute path or URL is needed. 
                We'll try a relative path from public or just text if image fails. */}
                    {/* <Image src="/compliai-logo-transparent.png" style={styles.logo} /> */}
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#06B6D4' }}>CompliAI</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.headerText}>Compliance Report</Text>
                        <Text style={styles.headerText}>{formattedDate}</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>EU AI Act Compliance Check</Text>
                    <Text style={styles.subtitle}>Erstellt für {user.name || user.email}</Text>
                    <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Check ID: {check.id}</Text>
                </View>

                {/* Key Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Gesamt-Score</Text>
                        <Text style={{ ...styles.statValue, color: check.overallScore >= 80 ? '#10B981' : check.overallScore >= 60 ? '#F59E0B' : '#EF4444' }}>
                            {check.overallScore}/100
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Risikostufe</Text>
                        <Text style={{ ...styles.statValue, color: getRiskColor(check.riskLevel) }}>
                            {getRiskLabel(check.riskLevel)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Status</Text>
                        <Text style={styles.statValue}>
                            {check.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Bearbeitung'}
                        </Text>
                    </View>
                </View>

                {/* Scores Breakdown */}
                <View>
                    <Text style={styles.sectionTitle}>Detailbewertung</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Technische Robustheit:</Text>
                        <Text style={styles.value}>{check.technicalScore}/100</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Dokumentation:</Text>
                        <Text style={styles.value}>{check.documentationScore}/100</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Governance:</Text>
                        <Text style={styles.value}>{check.governanceScore}/100</Text>
                    </View>
                </View>

                {/* Recommendations */}
                <View>
                    <Text style={styles.sectionTitle}>Handlungsempfehlungen</Text>
                    {recommendations.length > 0 ? (
                        recommendations.map((rec: any, index: number) => (
                            <View key={index} style={{
                                ...styles.recommendation,
                                borderLeftColor: rec.priority === 'HIGH' ? '#EF4444' : rec.priority === 'MEDIUM' ? '#F59E0B' : '#3B82F6'
                            }}>
                                <Text style={{ ...styles.recTitle, color: '#0F172A' }}>
                                    {rec.title} <Text style={{ fontSize: 8, color: '#64748B' }}>({rec.category})</Text>
                                </Text>
                                <Text style={styles.recDesc}>{rec.description}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic' }}>Keine spezifischen Empfehlungen.</Text>
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generiert von CompliAI - Ihr Assistent für EU AI Act Compliance.
                    Dieses Dokument dient als Orientierungshilfe und ersetzt keine rechtliche Beratung.
                </Text>
            </Page>
        </Document>
    );
};
