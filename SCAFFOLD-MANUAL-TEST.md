# Teste manual do comando scaffold-create

Este comando depende de CLIs externos (ex: r2pde-ai) e não é totalmente coberto por testes automatizados.

## Como testar manualmente

1. Execute o build do projeto:
   
   npm run build

2. Execute o comando scaffold-create apontando para o guia:
   
   node ./dist/src/cli.js scaffold-create --guide scaffold-guide.yaml

3. Verifique se a pasta `scaffold_done` foi criada e os arquivos esperados estão presentes.

4. Siga as mensagens do terminal para validar o sucesso do fluxo.

---

> Para cobertura automatizada, seria necessário mockar comandos CLI externos, o que não foi implementado por simplicidade e robustez dos testes.
