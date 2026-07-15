import { sasAnsConsultaManifestacao } from './sasAnsConsultaManifestacao';

const inicio = async () => {
  const x = await sasAnsConsultaManifestacao({
    manifestacao: '00624620240513063322',
  });
};

inicio();
