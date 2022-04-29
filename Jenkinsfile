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
                    sh 'touch backend/config.env'
                    sh 'echo $ATLAS_URI > backend/config.env'
                    sh 'echo $BACKEND_PORT >> backend/config.env'
                    sh 'echo $JWT_SECRET >> backend/config.env'
                    sh 'echo $JWT_EXPIRE >> backend/config.env'
                    sh 'cd backend; docker build -t $DOCKER_USER/backend:$BUILD_NUMBER .'
                    sh 'docker push $DOCKER_USER/backend:$BUILD_NUMBER'
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
                    sh "sed -i 's/DOCKER_REGISTRY/${docker_user}/g' backend-deployment.yaml"
                    sh "sed -i 's/BUILD_NUMBER/${BUILD_NUMBER}/g' backend-deployment.yaml"
                    sh 'scp -r -v -o StrictHostKeyChecking=no *.yaml eq901830@128.105.146.103:~/'
                    sh 'ssh -o StrictHostKeyChecking=no eq901830@128.105.146.103 kubectl apply -f /users/eq901830/backend-deployment.yaml -n jenkins'
                    sh 'ssh -o StrictHostKeyChecking=no eq901830@128.105.146.103 kubectl apply -f /users/eq901830/backend-service.yaml -n jenkins'                                        
                }
            }
        }
    }
}
