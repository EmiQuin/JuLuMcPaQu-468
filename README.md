# Pipeline

## Instructions
ssh into head node

run: bash /local/repository/launch_jenkins.sh

run: kubectl exec $(kubectl get pods -n jenkins | grep jenkins | awk '{print $1}') -n jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword

Use password to log in to Jenkins

run: ssh-keygen

run: cat .ssh/id_rsa.pub >> .ssh/authorized_keys

run: cat ~/.ssh/id_rsa

Copy key, INCLUDING top and bottom lines

Follow slides
