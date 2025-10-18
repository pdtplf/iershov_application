import random
import string

def generate(length=10):
    characters = string.ascii_lowercase + string.digits
    random_letters = ''.join(random.choice(characters) for _ in range(length))
    return random_letters

random_string = generate()
print("Random lowercase letters:", random_string)
