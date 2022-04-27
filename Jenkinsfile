pipeline {
    agent none 
    stages {
        stage ('Deploy') {
            agent {
                node {
                    label 'deploy'
                }
            }
            steps {
                sshagent(credentials: ['cloudlab']) {
                    sh 'scp -r -v -o StrictHostKeyChecking=no *.yaml eq901830@128.105.146.103:~/'
                    sh 'ssh -o StrictHostKeyChecking=no eq901830@128.105.146.103 kubectl apply -f /users/eq901830/mongo-deployment.yaml -n jenkins'
                    sh 'ssh -o StrictHostKeyChecking=no eq901830@128.105.146.103 kubectl apply -f /users/eq901830/mongo-service.yaml -n jenkins'                                        
                }
            }
        }
    }
}
