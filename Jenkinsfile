pipeline {
    agent none 
    environment {
        docker_user = "eq901830"
    }
    stages {
        stage('Publish') {
            agent {
                kubernetes {
                    inheritFrom 'agent-template'
                }
            }
            steps{
                container('docker') {
                    sh 'echo $DOCKER_TOKEN | docker login --username $DOCKER_USER --password-stdin'
                    sh 'cd frontend; docker build -t $DOCKER_USER/frontend:$BUILD_NUMBER .'
                    sh 'docker push $DOCKER_USER/frontend:$BUILD_NUMBER'
                }
            }
        }
        stage ('Deploy') {
            agent {
                node {
                    label 'deploy'
                }
            }
            steps {
                sshagent(credentials: ['cloudlab']) {
                    sh "sed -i 's/DOCKER_REGISTRY/${docker_user}/g' frontend-deployment.yaml"
                    sh "sed -i 's/BUILD_NUMBER/${BUILD_NUMBER}/g' frontend-deployment.yaml"
                    sh 'scp -r -v -o StrictHostKeyChecking=no *.yaml eq901830@128.105.146.103:~/'
                    sh 'ssh -o StrictHostKeyChecking=no eq901830@128.105.146.103 kubectl apply -f /users/eq901830/frontend-deployment.yaml -n jenkins'
                    sh 'ssh -o StrictHostKeyChecking=no eq901830@128.105.146.103 kubectl apply -f /users/eq901830/frontend-service.yaml -n jenkins'                                        
                }
            }
        }
    }
}
