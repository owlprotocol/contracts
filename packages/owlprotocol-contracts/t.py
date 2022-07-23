import sys

print()

s = sys.argv[1] 

newS = ''

for i in range(len(s)):
   newS += s[i] 
   if((i + 1) % 64 == 0):
        newS += '\n'

print(newS)
