import React, { useMemo } from 'react';
import JSZip from 'jszip';
import { Database, Zap, DollarSign } from 'lucide-react';
import { DB, SiteSettings, BackupLog } from '../types';

interface AdminInfraControlsProps {
    db: DB;
    setDb: React.Dispatch<React.SetStateAction<DB>>;
    siteSettings: SiteSettings;
    updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;
    addNetflixToast: (title: string, message: string, type?: "success" | "error" | "warning" | "info") => void;
    backupLogs: BackupLog[];
}

export default function AdminInfraControls({ db, setDb, siteSettings, updateSiteSettings, addNetflixToast, backupLogs }: AdminInfraControlsProps) {
    const estimatedReads = Number(sessionStorage.getItem("blzero_simulated_reads") || "0");
    const estimatedCost = useMemo(() => {
        // Spark plan: 50k reads free. $0.06 per 100k after.
        if (estimatedReads <= 50000) return 0;
        return ((estimatedReads - 50000) / 100000) * 0.06;
    }, [estimatedReads]);

    const exportFullSiteAsZip = async () => {
        const zip = new JSZip();
        // Incluir tudo que compõe o estado da aplicação
        zip.file("db_state.json", JSON.stringify(db, null, 2));
        zip.file("siteSettings.json", JSON.stringify(siteSettings, null, 2));
        zip.file("offline_cache.json", localStorage.getItem("blzero_cached_series") || "{}");
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_completo_blzero_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        addNetflixToast("Backup Completo", "Arquivo ZIP gerado com sucesso contendo todo o estado atual.", "success");
    };

    const importFullSiteFromZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const zip = await JSZip.loadAsync(file);
            
            const dbStateFile = zip.file("db_state.json");
            const siteSettingsFile = zip.file("siteSettings.json");
            const offlineCacheFile = zip.file("offline_cache.json");

            if (dbStateFile) {
                const dbState = JSON.parse(await dbStateFile.async("string"));
                setDb(dbState);
            }
            if (siteSettingsFile) {
                const settings = JSON.parse(await siteSettingsFile.async("string"));
                updateSiteSettings(settings);
            }
            if (offlineCacheFile) {
                const cache = await offlineCacheFile.async("string");
                localStorage.setItem("blzero_cached_series", cache);
            }

            addNetflixToast("Importação Concluída", "Dados restaurados com sucesso.", "success");
        } catch (error) {
            console.error("Erro na importação:", error);
            addNetflixToast("Erro na Importação", "Não foi possível processar o arquivo ZIP.", "error");
        }
    };

    return (
        <div className="border border-zinc-800 p-6 bg-zinc-950/40 rounded-sm mb-6 space-y-6">
            <h4 className="text-xs font-black uppercase text-white">Controles de Infraestrutura, Backup & Custos</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase mb-2">Simulador de Custos (Firebase)</p>
                    <div className="flex items-center gap-3">
                        <DollarSign size={20} className="text-green-500" />
                        <div>
                            <span className="block text-xl font-black text-white font-mono">${estimatedCost.toFixed(4)}</span>
                            <span className="text-[8px] text-zinc-500 uppercase">Estimativa USD (Leituras: {estimatedReads.toLocaleString()})</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={exportFullSiteAsZip} className="flex-1 bg-brand-red text-white py-3 px-4 rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition flex items-center justify-center">
                        <Database size={12} className="mr-2" /> Exportar ZIP Completo (Backup Total)
                    </button>
                    <label className="flex-1 bg-zinc-800 text-white py-3 px-4 rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-zinc-700 transition flex items-center justify-center cursor-pointer">
                        <Database size={12} className="mr-2" /> Importar ZIP Completo (Restaurar)
                        <input type="file" accept=".zip" onChange={importFullSiteFromZip} className="hidden" />
                    </label>
                    <button onClick={() => {
                        updateSiteSettings({ isGlobalTelemetryEnabled: !siteSettings.isGlobalTelemetryEnabled });
                        addNetflixToast("Telemetria", `Telemetria ${!siteSettings.isGlobalTelemetryEnabled ? "ATIVADA" : "DESATIVADA"}.`, !siteSettings.isGlobalTelemetryEnabled ? "success" : "warning");
                    }} className={`flex-1 ${siteSettings.isGlobalTelemetryEnabled ? 'bg-green-600' : 'bg-zinc-700'} text-white py-3 px-4 rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition flex items-center justify-center`}>
                        <Zap size={12} className="mr-2" /> {siteSettings.isGlobalTelemetryEnabled ? "Telemetria Ativa (Nuvem)" : "Telemetria Desativada (Modo Offline)"}
                    </button>
                </div>
            </div>

            <div className="bg-black/40 border border-zinc-800 rounded-sm overflow-hidden">
                <h5 className="text-[10px] font-black uppercase text-zinc-400 p-4 bg-black/50 border-b border-zinc-800">Logs de Backup Automático</h5>
                <div className="max-h-40 overflow-y-auto">
                    {backupLogs && backupLogs.length > 0 ? (
                        backupLogs.map((log: any) => (
                            <div key={`${log.id}-${log.timestamp}`} className="p-3 text-[9px] border-b border-zinc-800/50 font-mono flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                <span className="text-zinc-500">{log.timestamp}</span>
                                <span className={log.status === 'error' ? 'text-red-400' : 'text-zinc-300'}>{log.message}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-[9px] text-zinc-600 italic">Nenhum log de backup gerado ainda.</div>
                    )}
                </div>
            </div>

            <p className="text-[9px] text-zinc-500 leading-relaxed font-bold border-t border-zinc-800 pt-4">
                <strong>Exportar ZIP:</strong> Gera um arquivo compactado contendo seu catálogo completo, usuários, ratings e configurações. Use isso para garantir que você não perderá nada.<br />
                <strong>Telemetria Global:</strong> Ao desligar, você entra em modo 100% offline. A aplicação parará de sincronizar com o Firebase, impedindo leituras e escritas, o que zera possíveis custos.<br />
                <strong>Atenção:</strong> O gerenciamento de domínio (vínculo/desvínculo) é feito diretamente no painel do seu Provedor de Hospedagem ou Console do Firebase Hosting. Esta página apenas gerencia o estado da aplicação.
            </p>
        </div>
    );
}